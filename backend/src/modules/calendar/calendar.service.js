const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");

const STATUS_LOWER = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
};

const userSelect = { id: true, name: true, avatarUrl: true };

const serializeUser = (u) =>
  u ? { id: u.id, name: u.name, avatar_url: u.avatarUrl ?? null } : null;

const toDateOnly = (d) => (d ? d.toISOString().slice(0, 10) : null);

const serializeTaskEvent = (t) => {
  const project = t.story?.epic?.project ?? null;
  return {
    id: `task:${t.id}`,
    type: "task_due",
    taskId: t.id,
    identifier: t.identifier ?? null,
    title: t.title,
    date: toDateOnly(t.dueDate),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    status: STATUS_LOWER[t.status] || t.status,
    priority: t.priority || "medium",
    projectId: project?.id ?? null,
    projectName: project?.name ?? null,
    projectColor: project?.color ?? null,
    assignee: serializeUser(t.assignee),
  };
};

const serializeCustomEvent = (e, currentUserId, isAdmin) => ({
  id: `event:${e.id}`,
  type: "custom",
  eventId: e.id,
  title: e.title,
  description: e.description ?? null,
  date: toDateOnly(e.date),
  visibility: e.visibility,
  projectId: e.project?.id ?? null,
  projectName: e.project?.name ?? null,
  projectColor: e.project?.color ?? null,
  createdBy: serializeUser(e.createdBy),
  viewers: (e.viewers ?? []).map((v) => serializeUser(v.user)),
  canDelete: isAdmin || e.createdById === currentUserId,
  createdAt: e.createdAt.toISOString(),
});

const listTaskEvents = async (userId, isAdmin, fromDate, toDate) => {
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
      { story: { epic: { project: { members: { some: { userId } } } } } },
      { story: { epic: { project: { ownerId: userId } } } },
    ];
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: userSelect },
      story: {
        include: {
          epic: {
            include: {
              project: { select: { id: true, name: true, color: true } },
            },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return tasks.map(serializeTaskEvent);
};

const listCustomEvents = async (userId, isAdmin, fromDate, toDate) => {
  const where = {
    date: {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    },
  };

  if (!isAdmin) {
    where.OR = [
      { visibility: "PUBLIC" },
      { createdById: userId },
      { viewers: { some: { userId } } },
      { project: { ownerId: userId } },
      { project: { members: { some: { userId } } } },
    ];
  }

  const events = await prisma.calendarEvent.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, color: true } },
      createdBy: { select: userSelect },
      viewers: { include: { user: { select: userSelect } } },
    },
    orderBy: { date: "asc" },
  });

  return events.map((e) => serializeCustomEvent(e, userId, isAdmin));
};

const listEvents = async (userId, isAdmin, from, to) => {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const [taskEvents, customEvents] = await Promise.all([
    listTaskEvents(userId, isAdmin, fromDate, toDate),
    listCustomEvents(userId, isAdmin, fromDate, toDate),
  ]);

  return [...taskEvents, ...customEvents].sort((a, b) =>
    (a.date ?? "").localeCompare(b.date ?? ""),
  );
};

const createEvent = async (userId, payload) => {
  const title = (payload?.title ?? "").trim();
  const date = payload?.date ? new Date(payload.date) : null;
  if (!title) throw new AppError("Title is required", 400);
  if (!date || Number.isNaN(date.getTime())) {
    throw new AppError("A valid date is required", 400);
  }

  const visibility = payload.visibility === "RESTRICTED" ? "RESTRICTED" : "PUBLIC";
  const description = payload.description ? String(payload.description).trim() : null;
  const projectId = payload.projectId || null;
  const viewerIds = Array.isArray(payload.viewerIds)
    ? Array.from(new Set(payload.viewerIds.filter((id) => id && id !== userId)))
    : [];

  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new AppError("Project not found", 404);
  }

  if (viewerIds.length > 0) {
    const existing = await prisma.user.findMany({
      where: { id: { in: viewerIds } },
      select: { id: true },
    });
    if (existing.length !== viewerIds.length) {
      throw new AppError("Some viewers do not exist", 400);
    }
  }

  const created = await prisma.calendarEvent.create({
    data: {
      title,
      description,
      date,
      visibility,
      projectId,
      createdById: userId,
      viewers:
        visibility === "RESTRICTED" && viewerIds.length > 0
          ? { create: viewerIds.map((id) => ({ userId: id })) }
          : undefined,
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      createdBy: { select: userSelect },
      viewers: { include: { user: { select: userSelect } } },
    },
  });

  return serializeCustomEvent(created, userId, false);
};

const deleteEvent = async (id, userId, isAdmin) => {
  const event = await prisma.calendarEvent.findUnique({
    where: { id },
    select: { id: true, createdById: true },
  });
  if (!event) throw new AppError("Event not found", 404);
  if (!isAdmin && event.createdById !== userId) {
    throw new AppError("Forbidden", 403);
  }
  await prisma.calendarEvent.delete({ where: { id } });
  return { id };
};

module.exports = { listEvents, createEvent, deleteEvent };
