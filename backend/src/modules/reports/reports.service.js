const prisma = require("../../prisma/client");

/**
 * Construit le where pour limiter les tâches visibles par l'utilisateur
 * courant (admin = tout, sinon projets dont il est membre/owner ou
 * tâches qui lui sont assignées).
 */
const tasksWhere = (userId, isAdmin) => {
  if (isAdmin) return {};
  return {
    OR: [
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
    ],
  };
};

const STATUS_LABEL = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  IN_REVIEW: "En revue",
  DONE: "Terminé",
};

const PRIORITY_LABEL = {
  urgent: "Urgent",
  high: "Élevée",
  medium: "Moyenne",
  low: "Faible",
};

const overview = async (userId, isAdmin) => {
  const where = tasksWhere(userId, isAdmin);

  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      status: true,
      priority: true,
      assigneeId: true,
      updatedAt: true,
      createdAt: true,
      story: {
        select: {
          epic: {
            select: {
              project: {
                select: { id: true, name: true, color: true },
              },
            },
          },
        },
      },
      assignee: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  // Totaux globaux
  const totals = {
    tasks: tasks.length,
    done: 0,
    inProgress: 0,
    inReview: 0,
    todo: 0,
  };
  for (const t of tasks) {
    if (t.status === "DONE") totals.done++;
    else if (t.status === "IN_PROGRESS") totals.inProgress++;
    else if (t.status === "IN_REVIEW") totals.inReview++;
    else totals.todo++;
  }
  totals.completionRate =
    totals.tasks === 0
      ? 0
      : Math.round((totals.done / totals.tasks) * 1000) / 10;

  // Distribution par statut
  const byStatus = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].map((key) => ({
    key,
    label: STATUS_LABEL[key],
    count: tasks.filter((t) => t.status === key).length,
  }));

  // Distribution par priorité
  const byPriority = ["urgent", "high", "medium", "low"].map((key) => ({
    key,
    label: PRIORITY_LABEL[key],
    count: tasks.filter((t) => (t.priority ?? "medium").toLowerCase() === key)
      .length,
  }));

  // Distribution par projet
  const projectMap = new Map();
  for (const t of tasks) {
    const proj = t.story?.epic?.project;
    if (!proj) continue;
    if (!projectMap.has(proj.id)) {
      projectMap.set(proj.id, {
        projectId: proj.id,
        name: proj.name,
        color: proj.color ?? null,
        total: 0,
        done: 0,
        active: 0,
        review: 0,
        todo: 0,
      });
    }
    const bucket = projectMap.get(proj.id);
    bucket.total++;
    if (t.status === "DONE") bucket.done++;
    else if (t.status === "IN_PROGRESS") bucket.active++;
    else if (t.status === "IN_REVIEW") bucket.review++;
    else bucket.todo++;
  }
  const byProject = Array.from(projectMap.values()).sort(
    (a, b) => b.total - a.total,
  );

  // Top assignés
  const assigneeMap = new Map();
  for (const t of tasks) {
    if (!t.assigneeId || !t.assignee) continue;
    if (!assigneeMap.has(t.assigneeId)) {
      assigneeMap.set(t.assigneeId, {
        userId: t.assigneeId,
        name: t.assignee.name,
        avatar_url: t.assignee.avatarUrl ?? null,
        assigned: 0,
        done: 0,
      });
    }
    const a = assigneeMap.get(t.assigneeId);
    a.assigned++;
    if (t.status === "DONE") a.done++;
  }
  const topAssignees = Array.from(assigneeMap.values())
    .sort((a, b) => b.assigned - a.assigned)
    .slice(0, 5);

  // Completion par jour sur les 14 derniers jours (proxy : updatedAt
  // des tâches en DONE)
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      completed: 0,
    });
  }
  const dayIndex = new Map(days.map((d, i) => [d.date, i]));
  const dayMs = 24 * 60 * 60 * 1000;
  const cutoff = today.getTime() - 13 * dayMs;
  for (const t of tasks) {
    if (t.status !== "DONE") continue;
    const ts = new Date(t.updatedAt).getTime();
    if (ts < cutoff) continue;
    const iso = new Date(t.updatedAt).toISOString().slice(0, 10);
    if (dayIndex.has(iso)) days[dayIndex.get(iso)].completed++;
  }

  // Compteurs projets / membres
  const projectCount = isAdmin
    ? await prisma.project.count()
    : await prisma.project.count({
        where: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      });
  const memberCount = await prisma.user.count({
    where: { status: "APPROVED" },
  });

  return {
    totals: { ...totals, projects: projectCount, members: memberCount },
    byStatus,
    byPriority,
    byProject,
    topAssignees,
    completionByDay: days,
  };
};

module.exports = { overview };
