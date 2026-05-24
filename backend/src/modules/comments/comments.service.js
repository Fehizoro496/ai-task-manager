const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");
const { isMember } = require("../projects/projects.service");
const { createNotification } = require("../notifications/notifications.service");

const authorInclude = {
  author: {
    select: { id: true, name: true, avatarUrl: true },
  },
};

const serialize = (c) => ({
  id: c.id,
  taskId: c.taskId,
  body: c.body,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  authorId: c.authorId,
  author: c.author
    ? {
        id: c.author.id,
        name: c.author.name,
        avatar_url: c.author.avatarUrl ?? null,
      }
    : null,
});

/**
 * Vérifie qu'un user a accès à la tâche (admin / owner / membre / assigné)
 * et renvoie la tâche minimale. Sinon 404.
 */
const ensureTaskAccess = async (taskId, userId, isAdmin) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      assigneeId: true,
      story: {
        select: {
          epic: {
            select: {
              project: { select: { id: true, ownerId: true } },
            },
          },
        },
      },
    },
  });
  if (!task) throw new AppError("Task not found", 404);
  if (isAdmin) return task;
  const project = task.story.epic.project;
  if (project.ownerId === userId) return task;
  if (task.assigneeId === userId) return task;
  const member = await isMember(project.id, userId);
  if (!member) throw new AppError("Task not found", 404);
  return task;
};

const list = async (taskId, userId, isAdmin) => {
  await ensureTaskAccess(taskId, userId, isAdmin);
  const comments = await prisma.taskComment.findMany({
    where: { taskId },
    include: authorInclude,
    orderBy: { createdAt: "asc" },
  });
  return comments.map(serialize);
};

const create = async (taskId, userId, isAdmin, data) => {
  const task = await ensureTaskAccess(taskId, userId, isAdmin);
  const comment = await prisma.taskComment.create({
    data: {
      taskId,
      authorId: userId,
      body: data.body,
    },
    include: authorInclude,
  });

  // Notification pour l'assigné (si différent de l'auteur)
  if (task.assigneeId && task.assigneeId !== userId) {
    const taskInfo = await prisma.task.findUnique({
      where: { id: taskId },
      select: { identifier: true, title: true },
    });
    const author = comment.author?.name ?? "Un membre";
    const ident = taskInfo?.identifier ? `${taskInfo.identifier} ` : "";
    const projectId = task.story.epic.project.id;
    const link = `/projects/${projectId}/board?task=${taskId}`;
    await createNotification({
      type: "TASK_COMMENT",
      title: "Nouveau commentaire",
      message: `${author} a commenté ${ident}« ${taskInfo?.title ?? ""} ».`,
      userId: task.assigneeId,
      taskId,
      link,
    });
  }

  return serialize(comment);
};

const remove = async (id, userId, isAdmin) => {
  const comment = await prisma.taskComment.findUnique({ where: { id } });
  if (!comment) throw new AppError("Comment not found", 404);
  if (!isAdmin && comment.authorId !== userId) {
    throw new AppError("You can only delete your own comments", 403);
  }
  await prisma.taskComment.delete({ where: { id } });
};

module.exports = { list, create, remove };
