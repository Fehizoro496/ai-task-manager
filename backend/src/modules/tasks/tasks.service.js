const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");

// Map Prisma UPPERCASE status to lowercase for frontend
const statusToLowercase = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
};

/**
 * Serializes a Prisma Task into the format expected by the Flutter frontend.
 * Includes both camelCase and snake_case variants, and maps position→order.
 */
const serializeTask = (task, projectId) => {
  const computedProjectId = projectId || task.projectId || null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: statusToLowercase[task.status] || task.status,
    priority: task.priority || "medium",
    position: task.position,
    order: task.position,
    storyId: task.storyId,
    story_id: task.storyId,
    projectId: computedProjectId,
    project_id: computedProjectId,
    assigneeId: task.assigneeId || null,
    assignee_id: task.assigneeId || null,
    labels: task.labels || [],
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    due_date: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    created_at: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
  };
};

const verifyStoryOwnership = async (storyId, userId) => {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { epic: { include: { project: true } } },
  });
  if (!story || story.epic.project.ownerId !== userId) {
    throw new AppError("Story not found", 404);
  }
  return story;
};

const create = async (userId, data) => {
  await verifyStoryOwnership(data.storyId, userId);
  return prisma.task.create({ data });
};

const listByStory = async (storyId, userId) => {
  await verifyStoryOwnership(storyId, userId);
  return prisma.task.findMany({
    where: { storyId },
    orderBy: { position: "asc" },
  });
};

const getById = async (id, userId) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { story: { include: { epic: { include: { project: true } } } } },
  });

  if (!task || task.story.epic.project.ownerId !== userId) {
    throw new AppError("Task not found", 404);
  }

  return task;
};

const update = async (id, userId, data) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { story: { include: { epic: { include: { project: true } } } } },
  });

  if (!task || task.story.epic.project.ownerId !== userId) {
    throw new AppError("Task not found", 404);
  }

  return prisma.task.update({ where: { id }, data });
};

const remove = async (id, userId) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { story: { include: { epic: { include: { project: true } } } } },
  });

  if (!task || task.story.epic.project.ownerId !== userId) {
    throw new AppError("Task not found", 404);
  }

  return prisma.task.delete({ where: { id } });
};

const moveTask = async (id, userId, { status, position }) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { story: { include: { epic: { include: { project: true } } } } },
  });

  if (!task || task.story.epic.project.ownerId !== userId) {
    throw new AppError("Task not found", 404);
  }

  return prisma.task.update({
    where: { id },
    data: { status, position },
  });
};

const listByProject = async (projectId, userId) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return prisma.task.findMany({
    where: {
      story: { epic: { projectId } },
    },
    orderBy: { position: "asc" },
  });
};

const createForProject = async (userId, projectId, data) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // If storyId is provided, verify it belongs to this project
  if (data.storyId || data.story_id) {
    const storyId = data.storyId || data.story_id;
    const story = await prisma.story.findFirst({
      where: { id: storyId, epic: { projectId } },
    });
    if (!story) {
      throw new AppError("Story not found in this project", 404);
    }
    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || "medium",
        status: data.status || "TODO",
        storyId,
      },
    });
  }

  // No storyId: assign to the first story of the first epic, or create a default epic/story
  let story = await prisma.story.findFirst({
    where: { epic: { projectId } },
    orderBy: { position: "asc" },
  });

  if (!story) {
    const epic = await prisma.epic.create({
      data: { title: "Backlog", projectId, position: 0 },
    });
    story = await prisma.story.create({
      data: { title: "Default", epicId: epic.id, position: 0 },
    });
  }

  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || "medium",
      status: data.status || "TODO",
      storyId: story.id,
    },
  });
};

module.exports = {
  create,
  listByStory,
  getById,
  update,
  remove,
  moveTask,
  listByProject,
  createForProject,
  serializeTask,
};
