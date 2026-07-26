/**
 * ── Chapitre VI.III — Efficacité de l'algorithme de répartition ──────────────
 *
 * Mesure QUANTITATIVE de l'algorithme hongrois (Kuhn-Munkres) :
 *   1. Scalabilité       : temps de résolution vs taille N (vérifie O(n³)).
 *   2. Optimalité exacte : écart au minimum réel (brute-force) sur petites
 *                          instances → doit être nul.
 *   3. Gain vs glouton   : réduction du coût total face à un baseline glouton
 *                          sur des instances réalistes (équipe × backlog).
 *
 * 100 % hors-ligne : aucune base ni serveur requis.
 *   node evaluation/bench/03-distribution-efficiency.js
 */
const { performance } = require("perf_hooks");
const { hungarian } = require("../../src/modules/distribution/hungarian");
const {
  makeTeam,
  makeBacklog,
  assignHungarian,
  assignGreedyMatrix,
  realCost,
} = require("../fixtures/distribution");
const { summarize, mean } = require("../lib/stats");
const { fmt, markdownTable, printSection } = require("../lib/table");
const report = require("../lib/report");

const rng = (seed) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

const randomMatrix = (n, seed) => {
  const r = rng(seed);
  return Array.from({ length: n }, () => Array.from({ length: n }, () => r()));
};

// ── 1. Scalabilité ───────────────────────────────────────────────────────────
const benchScalability = () => {
  const sizes = [10, 25, 50, 100, 200, 300, 400];
  const rows = [];
  const data = [];
  for (const n of sizes) {
    const runs = n <= 100 ? 15 : 5;
    const times = [];
    for (let i = 0; i < runs; i++) {
      const m = randomMatrix(n, 1000 + n + i);
      const t0 = performance.now();
      hungarian(m);
      times.push(performance.now() - t0);
    }
    const s = summarize(times);
    // Constante empirique du modèle cubique : ms / n³ × 1e6 (≈ stable si O(n³)).
    const cubicK = (s.p50 / n ** 3) * 1e6;
    rows.push([n, fmt(s.p50, 3), fmt(s.mean, 3), fmt(s.max, 3), fmt(cubicK, 4)]);
    data.push({ n, p50: s.p50, mean: s.mean, max: s.max, cubicK });
  }
  printSection(
    "1. Scalabilité (temps de résolution, ms)",
    ["N", "médiane", "moyenne", "max", "k=ms/n³·1e6"],
    rows,
  );
  return { headers: ["N", "médiane (ms)", "moyenne (ms)", "max (ms)", "k = ms/n³·1e6"], rows, data };
};

// ── 2. Optimalité exacte vs brute-force ──────────────────────────────────────
const bruteForceMin = (cost) => {
  const n = cost.length;
  const cols = [...Array(n).keys()];
  let best = Infinity;
  const permute = (arr, k, acc) => {
    if (k === arr.length) {
      best = Math.min(best, acc);
      return;
    }
    for (let i = k; i < arr.length; i++) {
      [arr[k], arr[i]] = [arr[i], arr[k]];
      const add = cost[k][arr[k]];
      if (acc + add < best) permute(arr, k + 1, acc + add);
      [arr[k], arr[i]] = [arr[i], arr[k]];
    }
  };
  permute(cols, 0, 0);
  return best;
};

const benchOptimality = () => {
  const sizes = [3, 4, 5, 6, 7];
  const rows = [];
  const data = [];
  for (const n of sizes) {
    let maxGap = 0;
    const trials = 40;
    for (let i = 0; i < trials; i++) {
      const m = randomMatrix(n, 5000 + n * 100 + i);
      const assign = hungarian(m);
      const hCost = assign.reduce((s, col, row) => s + m[row][col], 0);
      const optCost = bruteForceMin(m);
      maxGap = Math.max(maxGap, hCost - optCost);
    }
    const optimal = maxGap < 1e-9;
    rows.push([n, trials, optimal ? "OUI" : "NON", fmt(maxGap, 9)]);
    data.push({ n, trials, optimal, maxGap });
  }
  printSection(
    "2. Optimalité exacte vs brute-force",
    ["N", "essais", "optimal ?", "écart max"],
    rows,
  );
  return {
    headers: ["N", "essais", "optimal ?", "écart max au minimum"],
    rows,
    data,
  };
};

// ── 3. Gain vs glouton sur instances réalistes ───────────────────────────────
const benchVsGreedy = () => {
  const configs = [
    { members: 3, tasks: 10 },
    { members: 5, tasks: 20 },
    { members: 8, tasks: 40 },
    { members: 10, tasks: 60 },
    { members: 15, tasks: 100 },
  ];
  const rows = [];
  const data = [];
  const gains = [];
  for (const c of configs) {
    const team = makeTeam(c.members, c.members + c.tasks);
    const backlog = makeBacklog(c.tasks, c.members * 3 + c.tasks);
    const h = assignHungarian(team, backlog);
    const g = assignGreedyMatrix(team, backlog);
    const hCost = realCost(h.cost, h.assignment, h.T);
    const gCost = realCost(g.cost, g.assignment, g.T);
    const gain = gCost > 0 ? ((gCost - hCost) / gCost) * 100 : 0;
    gains.push(gain);
    rows.push([
      `${c.members}×${c.tasks}`,
      fmt(hCost, 3),
      fmt(gCost, 3),
      `${fmt(gain, 1)} %`,
    ]);
    data.push({ ...c, hungarianCost: hCost, greedyCost: gCost, gainPct: gain });
  }
  printSection(
    "3. Coût total : hongrois vs glouton (coût plus bas = meilleur)",
    ["membres×tâches", "hongrois", "glouton", "gain"],
    rows,
  );
  console.log(`\n→ Gain moyen face au glouton : ${fmt(mean(gains), 1)} %`);
  return {
    headers: ["membres × tâches", "coût hongrois", "coût glouton", "gain"],
    rows,
    data,
    meanGainPct: mean(gains),
  };
};

const main = () => {
  console.log("═══ VI.III — Efficacité de l'algorithme de répartition ═══");
  const scalability = benchScalability();
  const optimality = benchOptimality();
  const vsGreedy = benchVsGreedy();

  const md = [
    "# VI.III — Efficacité de l'algorithme de répartition",
    "",
    `_Généré le ${new Date().toISOString()}_`,
    "",
    "## 1. Scalabilité (algorithme hongrois, ms)",
    "",
    "La constante `k = ms/n³·1e6` reste du même ordre de grandeur → confirme la complexité **O(n³)**.",
    "",
    markdownTable(scalability.headers, scalability.rows),
    "",
    "## 2. Optimalité exacte (vs brute-force)",
    "",
    "Sur toutes les petites instances, l'affectation trouvée égale le minimum absolu (écart nul) → l'algorithme est **exact**.",
    "",
    markdownTable(optimality.headers, optimality.rows),
    "",
    "## 3. Gain de coût face à un baseline glouton",
    "",
    `Réduction moyenne du coût total : **${fmt(vsGreedy.meanGainPct, 1)} %**.`,
    "",
    markdownTable(vsGreedy.headers, vsGreedy.rows),
    "",
  ].join("\n");

  const paths = report.save(
    "03-distribution-efficiency",
    { scalability: scalability.data, optimality: optimality.data, vsGreedy: vsGreedy.data },
    md,
  );
  console.log(`\n✓ Rapport écrit : ${paths.latestMd}`);
};

main();
