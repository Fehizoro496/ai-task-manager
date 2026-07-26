/**
 * Fixtures & modèle de scoring pour l'évaluation de la répartition de tâches.
 *
 * Le scoring est RÉ-IMPLÉMENTÉ à l'identique de `distribution.service` (mêmes
 * poids, même pénalité d'équilibrage, même construction de matrice de coûts),
 * afin de tester l'algorithme sur des équipes/backlogs synthétiques SANS base
 * de données. Toute divergence fausserait l'évaluation : garder synchronisé.
 *
 * L'algorithme hongrois lui-même est importé du code de production (pur).
 */
const { hungarian } = require("../../src/modules/distribution/hungarian");

// ── Constantes miroir de distribution.service ────────────────────────────────
const WEIGHTS = { skill: 0.5, availability: 0.3, performance: 0.2 };
const PRIORITY_WEIGHT = { urgent: 3, high: 2, medium: 1.5, low: 1 };
const BALANCE_PENALTY = 0.15;

const normalize = (s) => String(s ?? "").trim().toLowerCase();

// Adéquation compétence ∈ [0,1] : miroir de skillMatch().
const skillMatch = (labels, member) => {
  const list = (Array.isArray(labels) ? labels : []).map(normalize).filter(Boolean);
  if (list.length === 0) return 0.5;
  let sum = 0;
  for (const label of list) {
    const level = member.skillMap.get(label);
    sum += level ? level / 5 : 0;
  }
  return sum / list.length;
};

// Score global ∈ [0,1] : miroir de scoreFor().
const scoreFor = (task, member) =>
  WEIGHTS.skill * skillMatch(task.labels, member) +
  WEIGHTS.availability * member.availability +
  WEIGHTS.performance * member.performance;

// ── RNG déterministe (reproductibilité des benchmarks) ───────────────────────
const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const SKILL_POOL = [
  "frontend", "backend", "database", "devops", "design",
  "mobile", "testing", "security", "api", "documentation",
];
const PRIORITIES = ["low", "medium", "high", "urgent"];

/**
 * Génère une équipe de `n` membres avec compétences, disponibilité et
 * performance aléatoires mais reproductibles.
 */
const makeTeam = (n, seed = 1) => {
  const rnd = mulberry32(seed * 7919);
  const members = [];
  for (let i = 0; i < n; i++) {
    const skillMap = new Map();
    // 2 à 4 compétences par membre, niveau 1..5.
    const k = 2 + Math.floor(rnd() * 3);
    const pool = [...SKILL_POOL];
    for (let s = 0; s < k && pool.length; s++) {
      const idx = Math.floor(rnd() * pool.length);
      const name = pool.splice(idx, 1)[0];
      skillMap.set(name, 1 + Math.floor(rnd() * 5));
    }
    members.push({
      id: `M${i}`,
      name: `Membre ${i}`,
      skillMap,
      availability: 0.2 + rnd() * 0.8, // ∈ [0.2, 1]
      performance: 0.3 + rnd() * 0.7, // ∈ [0.3, 1]
    });
  }
  return members;
};

/**
 * Génère un backlog de `n` tâches avec labels et priorités reproductibles.
 */
const makeBacklog = (n, seed = 1) => {
  const rnd = mulberry32(seed * 104729 + 17);
  const tasks = [];
  for (let i = 0; i < n; i++) {
    const labels = [];
    const k = Math.floor(rnd() * 3); // 0 à 2 labels
    for (let l = 0; l < k; l++) {
      labels.push(SKILL_POOL[Math.floor(rnd() * SKILL_POOL.length)]);
    }
    tasks.push({
      id: `T${i}`,
      labels,
      priority: PRIORITIES[Math.floor(rnd() * PRIORITIES.length)],
    });
  }
  return tasks;
};

/**
 * Construit la matrice de coûts carrée (slots × tâches) — miroir exact de
 * distributeProject(). Retourne aussi la table `slots` pour retrouver le membre.
 */
const buildCostMatrix = (members, tasks) => {
  const M = members.length;
  const T = tasks.length;
  const slotsPer = Math.ceil(T / M) + 1;
  const slots = [];
  for (let mi = 0; mi < M; mi++) {
    for (let k = 0; k < slotsPer; k++) slots.push({ memberIdx: mi, k });
  }
  const S = slots.length;
  const N = Math.max(T, S);
  const cost = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let ti = 0; ti < N; ti++) {
    for (let si = 0; si < N; si++) {
      if (ti >= T || si >= S) continue; // ligne/colonne fictive → coût 0
      const { memberIdx, k } = slots[si];
      cost[ti][si] = 1 - scoreFor(tasks[ti], members[memberIdx]) + k * BALANCE_PENALTY;
    }
  }
  return { cost, slots, M, T, S, N };
};

// Coût total réel des tâches (hors lignes/colonnes fictives).
const realCost = (cost, assignment, T) => {
  let total = 0;
  for (let ti = 0; ti < T; ti++) {
    const si = assignment[ti];
    if (si >= 0) total += cost[ti][si];
  }
  return total;
};

// Convertit une affectation (slots) en indices de membres par tâche.
const toMemberAssignment = (assignment, slots, T) => {
  const out = new Array(T).fill(-1);
  for (let ti = 0; ti < T; ti++) {
    const si = assignment[ti];
    if (si >= 0 && si < slots.length) out[ti] = slots[si].memberIdx;
  }
  return out;
};

// ── Stratégies d'affectation ────────────────────────────────────────────────

// Optimale : algorithme hongrois sur la matrice de coûts.
const assignHungarian = (members, tasks) => {
  const { cost, slots, T } = buildCostMatrix(members, tasks);
  const assignment = hungarian(cost);
  return { memberOf: toMemberAssignment(assignment, slots, T), cost, assignment, T };
};

// Baseline glouton : sur la MÊME matrice, chaque tâche prend le slot libre le
// moins coûteux (dans l'ordre). Sert de comparaison d'optimalité.
const assignGreedyMatrix = (members, tasks) => {
  const { cost, slots, T, S } = buildCostMatrix(members, tasks);
  const usedSlot = new Array(S).fill(false);
  const assignment = new Array(T).fill(-1);
  for (let ti = 0; ti < T; ti++) {
    let best = -1;
    let bestCost = Infinity;
    for (let si = 0; si < S; si++) {
      if (usedSlot[si]) continue;
      if (cost[ti][si] < bestCost) {
        bestCost = cost[ti][si];
        best = si;
      }
    }
    if (best >= 0) {
      usedSlot[best] = true;
      assignment[ti] = best;
    }
  }
  return { memberOf: toMemberAssignment(assignment, slots, T), cost, assignment, T };
};

// Baseline "compétence seule" : chaque tâche au membre de meilleure adéquation
// compétence, sans souci d'équilibrage (illustre l'intérêt de l'équilibrage).
const assignBestSkill = (members, tasks) => {
  const memberOf = tasks.map((task) => {
    let best = 0;
    let bestScore = -1;
    members.forEach((m, mi) => {
      const s = skillMatch(task.labels, m);
      if (s > bestScore) {
        bestScore = s;
        best = mi;
      }
    });
    return best;
  });
  return { memberOf };
};

// Baseline aléatoire (reproductible).
const assignRandom = (members, tasks, seed = 1) => {
  const rnd = mulberry32(seed * 2654435761);
  const memberOf = tasks.map(() => Math.floor(rnd() * members.length));
  return { memberOf };
};

// ── Mesures de qualité d'une affectation ─────────────────────────────────────

/** Charge pondérée par membre (somme des poids de priorité des tâches reçues). */
const loadsPerMember = (members, tasks, memberOf) => {
  const loads = new Array(members.length).fill(0);
  memberOf.forEach((mi, ti) => {
    if (mi < 0) return;
    loads[mi] += PRIORITY_WEIGHT[normalize(tasks[ti].priority)] ?? 1.5;
  });
  return loads;
};

/** Adéquation compétence moyenne des tâches réellement affectées. */
const avgSkillFit = (members, tasks, memberOf) => {
  const fits = [];
  memberOf.forEach((mi, ti) => {
    if (mi >= 0) fits.push(skillMatch(tasks[ti].labels, members[mi]));
  });
  return fits.length ? fits.reduce((a, b) => a + b, 0) / fits.length : 0;
};

/** Score de compatibilité global moyen des affectations. */
const avgScore = (members, tasks, memberOf) => {
  const scores = [];
  memberOf.forEach((mi, ti) => {
    if (mi >= 0) scores.push(scoreFor(tasks[ti], members[mi]));
  });
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
};

module.exports = {
  WEIGHTS,
  PRIORITY_WEIGHT,
  BALANCE_PENALTY,
  SKILL_POOL,
  skillMatch,
  scoreFor,
  makeTeam,
  makeBacklog,
  buildCostMatrix,
  realCost,
  assignHungarian,
  assignGreedyMatrix,
  assignBestSkill,
  assignRandom,
  loadsPerMember,
  avgSkillFit,
  avgScore,
};
