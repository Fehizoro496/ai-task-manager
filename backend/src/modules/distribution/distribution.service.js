const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");
const { hungarian } = require("./hungarian");

/**
 * ───────────────────────────────────────────────────────────────────
 *  Répartition de tâches : score de compatibilité (user × tâche) puis
 *  affectation.
 *   - Mode "suggestion" : meilleur assigné pour UNE tâche (glouton).
 *   - Mode "lot" : répartition globalement optimale d'un backlog via
 *     l'algorithme hongrois.
 * ───────────────────────────────────────────────────────────────────
 */

// Pondérations du score (documentées, ajustables). Somme = 1.
const WEIGHTS = { skill: 0.5, availability: 0.3, performance: 0.2 };

// Poids de charge par priorité d'une tâche active.
const PRIORITY_WEIGHT = { urgent: 3, high: 2, medium: 1.5, low: 1 };

// Pénalité ajoutée à chaque tâche supplémentaire affectée au même membre
// (mode lot) → encourage l'équilibrage avant de doubler la charge.
const BALANCE_PENALTY = 0.15;

const normalize = (s) => String(s ?? "").trim().toLowerCase();

/**
 * Construit le contexte de scoring pour un projet : membres, leurs
 * compétences, leur charge active (globale) et leur performance.
 */
const buildContext = async (projectId) => {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          weeklyCapacity: true,
          skills: { include: { skill: true } },
        },
      },
    },
  });

  const users = members.map((m) => m.user).filter(Boolean);
  const userIds = users.map((u) => u.id);

  // Charge active (toutes tâches non terminées assignées, pondérée).
  const activeTasks = userIds.length
    ? await prisma.task.findMany({
        where: { assigneeId: { in: userIds }, status: { not: "DONE" } },
        select: { assigneeId: true, priority: true },
      })
    : [];

  const loadByUser = new Map(userIds.map((id) => [id, 0]));
  for (const t of activeTasks) {
    const w = PRIORITY_WEIGHT[normalize(t.priority)] ?? 1.5;
    loadByUser.set(t.assigneeId, (loadByUser.get(t.assigneeId) ?? 0) + w);
  }

  // Performance : taux de complétion historique (done / total assigné).
  const grouped = userIds.length
    ? await prisma.task.groupBy({
        by: ["assigneeId", "status"],
        where: { assigneeId: { in: userIds } },
        _count: { _all: true },
      })
    : [];
  const doneByUser = new Map();
  const totalByUser = new Map();
  for (const g of grouped) {
    const c = g._count._all;
    totalByUser.set(g.assigneeId, (totalByUser.get(g.assigneeId) ?? 0) + c);
    if (g.status === "DONE") {
      doneByUser.set(g.assigneeId, (doneByUser.get(g.assigneeId) ?? 0) + c);
    }
  }

  return users.map((u) => {
    const skillMap = new Map();
    for (const us of u.skills ?? []) {
      if (us.skill?.name) skillMap.set(us.skill.name, us.level);
    }
    const capacity = Math.max(1, u.weeklyCapacity ?? 10);
    const load = loadByUser.get(u.id) ?? 0;
    const total = totalByUser.get(u.id) ?? 0;
    const done = doneByUser.get(u.id) ?? 0;
    return {
      id: u.id,
      name: u.name,
      avatar_url: u.avatarUrl ?? null,
      capacity,
      load,
      // Disponibilité ∈ [0,1] : 1 = libre, 0 = saturé.
      availability: Math.max(0, Math.min(1, 1 - load / capacity)),
      // Performance ∈ [0,1] : neutre (0.5) si aucun historique.
      performance: total === 0 ? 0.5 : done / total,
      skillMap,
    };
  });
};

/**
 * Adéquation compétence ∈ [0,1] entre une tâche (ses labels) et un user.
 * Tâche sans label → neutre (0.5), le score se joue alors sur la charge
 * et la performance.
 */
const skillMatch = (labels, member) => {
  const list = (Array.isArray(labels) ? labels : [])
    .map(normalize)
    .filter(Boolean);
  if (list.length === 0) return 0.5;
  let sum = 0;
  for (const label of list) {
    const level = member.skillMap.get(label);
    sum += level ? level / 5 : 0;
  }
  return sum / list.length;
};

/** Score de compatibilité global ∈ [0,1] + détail explicable. */
const scoreFor = (task, member) => {
  const skill = skillMatch(task.labels, member);
  const availability = member.availability;
  const performance = member.performance;
  const total =
    WEIGHTS.skill * skill +
    WEIGHTS.availability * availability +
    WEIGHTS.performance * performance;
  return {
    score: Math.round(total * 1000) / 1000,
    breakdown: {
      skill: Math.round(skill * 100) / 100,
      availability: Math.round(availability * 100) / 100,
      performance: Math.round(performance * 100) / 100,
    },
  };
};

const memberSummary = (m) => ({
  id: m.id,
  name: m.name,
  avatar_url: m.avatar_url,
  load: Math.round(m.load * 10) / 10,
  capacity: m.capacity,
});

/**
 * Suggestion pour UNE tâche : classement des membres du projet par score.
 */
const suggestForTask = async (taskId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { story: { include: { epic: { include: { project: true } } } } },
  });
  if (!task) throw new AppError("Task not found", 404);
  const projectId = task.story?.epic?.project?.id;
  if (!projectId) throw new AppError("Project not found for task", 404);

  const members = await buildContext(projectId);
  const ranked = members
    .map((m) => {
      const { score, breakdown } = scoreFor(task, m);
      return { ...memberSummary(m), score, breakdown };
    })
    .sort((a, b) => b.score - a.score);

  return {
    taskId,
    projectId,
    labels: Array.isArray(task.labels) ? task.labels : [],
    suggestions: ranked,
  };
};

/**
 * Répartition d'un lot via l'algorithme hongrois. Renvoie un APERÇU
 * (aucune écriture) : l'application est confirmée séparément.
 */
const distributeProject = async (projectId, taskIds = null) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Project not found", 404);

  const members = await buildContext(projectId);
  if (members.length === 0) {
    throw new AppError("Le projet n'a aucun membre.", 400);
  }

  // Tâches cibles : celles fournies, sinon le backlog non assigné non terminé.
  const where = {
    story: { epic: { projectId } },
    status: { not: "DONE" },
    ...(Array.isArray(taskIds) && taskIds.length
      ? { id: { in: taskIds } }
      : { assigneeId: null }),
  };
  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      identifier: true,
      title: true,
      labels: true,
      priority: true,
    },
  });

  if (tasks.length === 0) {
    return { projectId, assignments: [], unassignedCount: 0 };
  }

  const M = members.length;
  const T = tasks.length;

  // Chaque membre est dédoublé en "slots" pour pouvoir recevoir plusieurs
  // tâches. slotsPer garantit assez de slots pour toutes les tâches.
  const slotsPer = Math.ceil(T / M) + 1;
  const slots = []; // { memberIdx, k }
  for (let mi = 0; mi < M; mi++) {
    for (let k = 0; k < slotsPer; k++) slots.push({ memberIdx: mi, k });
  }
  const S = slots.length; // S >= T

  // Matrice carrée N×N (on complète avec des tâches fictives à coût nul).
  const N = Math.max(T, S);
  const cost = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let ti = 0; ti < N; ti++) {
    for (let si = 0; si < N; si++) {
      if (ti >= T || si >= S) {
        cost[ti][si] = 0; // ligne ou colonne fictive
        continue;
      }
      const { memberIdx, k } = slots[si];
      const { score } = scoreFor(tasks[ti], members[memberIdx]);
      // Coût = 1 − score (minimisation) + pénalité d'empilement.
      cost[ti][si] = 1 - score + k * BALANCE_PENALTY;
    }
  }

  const assignment = hungarian(cost);

  const assignments = [];
  for (let ti = 0; ti < T; ti++) {
    const si = assignment[ti];
    if (si === undefined || si < 0 || si >= S) continue;
    const { memberIdx } = slots[si];
    const member = members[memberIdx];
    const { score, breakdown } = scoreFor(tasks[ti], member);
    assignments.push({
      taskId: tasks[ti].id,
      identifier: tasks[ti].identifier ?? null,
      title: tasks[ti].title,
      labels: Array.isArray(tasks[ti].labels) ? tasks[ti].labels : [],
      assignee: {
        id: member.id,
        name: member.name,
        avatar_url: member.avatar_url,
      },
      score,
      breakdown,
    });
  }

  return { projectId, assignments, unassignedCount: 0 };
};

/**
 * Applique une liste d'affectations (après confirmation de l'aperçu).
 * Réservé à l'owner du projet ou à un admin.
 */
const applyAssignments = async (projectId, userId, isAdmin, assignments) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Project not found", 404);
  if (!isAdmin && project.ownerId !== userId) {
    throw new AppError("Forbidden", 403);
  }
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return { updated: 0 };
  }

  let updated = 0;
  for (const a of assignments) {
    if (!a?.taskId || !a?.userId) continue;
    await prisma.task.update({
      where: { id: a.taskId },
      data: { assigneeId: a.userId },
    });
    updated++;
  }
  return { updated };
};

module.exports = {
  buildContext,
  scoreFor,
  suggestForTask,
  distributeProject,
  applyAssignments,
  WEIGHTS,
};
