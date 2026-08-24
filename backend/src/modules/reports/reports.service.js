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
      { project: { members: { some: { userId } } } },
      { project: { ownerId: userId } },
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

const DAY_MS = 24 * 60 * 60 * 1000;
const VALID_UNITS = new Set(["day", "week", "month"]);

// Libellés français gérés à la main pour ne pas dépendre de l'ICU du runtime.
const MONTHS_LONG = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];
const MONTHS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

const pad2 = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Normalise l'unité et la date d'ancrage. L'intervalle vaut toujours une
 * seule période ; l'ancrage désigne n'importe quelle date à l'intérieur de
 * celle-ci.
 */
const normalizeRange = ({ unit, anchor } = {}) => {
  const u = VALID_UNITS.has(unit) ? unit : "day";
  let a = null;
  if (typeof anchor === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(anchor);
    if (m) a = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  if (!a || Number.isNaN(a.getTime())) a = new Date();
  return { unit: u, anchor: startOfDay(a) };
};

/**
 * Calcule les bornes [start, end) de la période contenant l'ancrage.
 * La semaine démarre le lundi.
 */
const buildPeriod = (unit, anchor) => {
  const a = startOfDay(anchor);
  let start;
  let end;
  if (unit === "day") {
    start = a;
    end = new Date(a);
    end.setDate(a.getDate() + 1);
  } else if (unit === "week") {
    const back = (a.getDay() + 6) % 7; // lundi = 0
    start = new Date(a);
    start.setDate(a.getDate() - back);
    end = new Date(start);
    end.setDate(start.getDate() + 7);
  } else {
    start = new Date(a.getFullYear(), a.getMonth(), 1);
    end = new Date(a.getFullYear(), a.getMonth() + 1, 1);
  }
  return { start, end };
};

/** Libellé lisible de la période (français). */
const periodLabel = (unit, start, end) => {
  if (unit === "day") {
    return `${start.getDate()} ${MONTHS_LONG[start.getMonth()]} ${start.getFullYear()}`;
  }
  if (unit === "month") {
    return `${MONTHS_LONG[start.getMonth()]} ${start.getFullYear()}`;
  }
  // Semaine : end est exclusif → dernier jour = end - 1
  const last = new Date(end);
  last.setDate(last.getDate() - 1);
  if (start.getMonth() === last.getMonth()) {
    return `Semaine du ${start.getDate()} au ${last.getDate()} ${MONTHS_LONG[last.getMonth()]} ${last.getFullYear()}`;
  }
  return `Semaine du ${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} au ${last.getDate()} ${MONTHS_SHORT[last.getMonth()]} ${last.getFullYear()}`;
};

/**
 * Construit les sous-segments de la période pour la timeline de livraison :
 * heures pour un jour, jours pour une semaine ou un mois.
 */
const buildBuckets = (unit, start, end) => {
  const buckets = [];
  if (unit === "day") {
    for (let h = 0; h < 24; h++) {
      buckets.push({ date: `${isoDate(start)}T${pad2(h)}`, label: `${h}h`, completed: 0 });
    }
  } else {
    const days = Math.round((end.getTime() - start.getTime()) / DAY_MS);
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const label = unit === "week" ? `${d.getDate()}/${d.getMonth() + 1}` : `${d.getDate()}`;
      buckets.push({ date: isoDate(d), label, completed: 0 });
    }
  }
  return buckets;
};

/** Index du sous-segment contenant l'horodatage (tâches déjà bornées à la période). */
const bucketIndex = (unit, start, ts) => {
  if (unit === "day") return ts.getHours();
  return Math.floor((startOfDay(ts).getTime() - start.getTime()) / DAY_MS);
};

const overview = async (userId, isAdmin, rangeInput) => {
  const { unit, anchor } = normalizeRange(rangeInput);
  const { start, end } = buildPeriod(unit, anchor);

  // Toute la page reflète la période : on ne garde que les tâches ayant eu
  // de l'activité (updatedAt) dans la fenêtre.
  const where = {
    AND: [tasksWhere(userId, isAdmin), { updatedAt: { gte: start, lt: end } }],
  };

  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      status: true,
      priority: true,
      assigneeId: true,
      updatedAt: true,
      project: {
        select: { id: true, name: true, color: true },
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
    const proj = t.project;
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

  // Timeline de livraison : tâches passées en DONE, réparties dans les
  // sous-segments de la période.
  const buckets = buildBuckets(unit, start, end);
  for (const t of tasks) {
    if (t.status !== "DONE") continue;
    const idx = bucketIndex(unit, start, new Date(t.updatedAt));
    if (idx >= 0 && idx < buckets.length) buckets[idx].completed++;
  }
  const completionByDay = buckets.map((b) => ({
    date: b.date,
    label: b.label,
    completed: b.completed,
  }));

  return {
    // Compteurs dérivés de la période (projets et contributeurs actifs).
    totals: {
      ...totals,
      projects: projectMap.size,
      members: assigneeMap.size,
    },
    byStatus,
    byPriority,
    byProject,
    topAssignees,
    completionByDay,
    range: {
      unit,
      anchor: isoDate(anchor),
      start: isoDate(start),
      end: isoDate(end),
      label: periodLabel(unit, start, end),
    },
  };
};

module.exports = { overview };
