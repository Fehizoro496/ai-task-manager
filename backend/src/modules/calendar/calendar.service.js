const prisma = require("../../prisma/client");

const STATUS_LOWER = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
};

/**
 * Liste les events du calendrier dans la fenêtre [from, to].
 * Source unique pour l'instant : les tâches ayant une dueDate.
 * Visibilité :
 *   - admin : toutes les tâches
 *   - autre : tâches assignées au user OU appartenant à un projet membre
 */
const listEvents = async (userId, isAdmin, from, to) => {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const where = {
    dueDate: {
      not: null,
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    },
  };

  if (!isAdmin) {
    where.OR = [
      { assigneeId: userId },
      {
        story: {
          epic: {
            project: { members: { some: { userId } } },
          },
        },
      },
      {
        story: {
          epic: {
            project: { ownerId: userId },
          },
        },
      },
    ];
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      story: {
        include: {
          epic: {
            include: {
              project: {
                select: { id: true, name: true, color: true },
              },
            },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return tasks.map((t) => {
    const project = t.story?.epic?.project ?? null;
    return {
      id: `task:${t.id}`,
      type: "task_due",
      taskId: t.id,
      identifier: t.identifier ?? null,
      title: t.title,
      date: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      status: STATUS_LOWER[t.status] || t.status,
      priority: t.priority || "medium",
      projectId: project?.id ?? null,
      projectName: project?.name ?? null,
      projectColor: project?.color ?? null,
      assignee: t.assignee
        ? {
            id: t.assignee.id,
            name: t.assignee.name,
            avatar_url: t.assignee.avatarUrl ?? null,
          }
        : null,
    };
  });
};

module.exports = { listEvents };
