/**
 * Statistiques descriptives réutilisées par tous les benchmarks.
 * Aucune dépendance externe.
 */

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const mean = (xs) => (xs.length ? sum(xs) / xs.length : 0);
const min = (xs) => (xs.length ? Math.min(...xs) : 0);
const max = (xs) => (xs.length ? Math.max(...xs) : 0);

// Écart-type d'échantillon (n-1). Renvoie 0 pour n < 2.
const stdev = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1));
};

// Coefficient de variation (%) : dispersion relative, comparable entre séries.
const cv = (xs) => {
  const m = mean(xs);
  return m === 0 ? 0 : (stdev(xs) / m) * 100;
};

// Percentile par interpolation linéaire (méthode "nearest-rank" adoucie).
// p ∈ [0,100]. Trie une copie, ne mute pas l'entrée.
const percentile = (xs, p) => {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (rank - lo) * (sorted[hi] - sorted[lo]);
};

/**
 * Résumé complet d'une série de mesures (latences, scores…).
 * @returns {{n,mean,stdev,cv,min,p50,p90,p95,p99,max}}
 */
const summarize = (xs) => ({
  n: xs.length,
  mean: mean(xs),
  stdev: stdev(xs),
  cv: cv(xs),
  min: min(xs),
  p50: percentile(xs, 50),
  p90: percentile(xs, 90),
  p95: percentile(xs, 95),
  p99: percentile(xs, 99),
  max: max(xs),
});

/**
 * Coefficient de Gini ∈ [0,1] : mesure d'inégalité d'une distribution
 * (0 = parfaitement égal, 1 = tout concentré sur un seul). Utilisé pour
 * quantifier l'équilibrage de charge de la répartition.
 */
const gini = (xs) => {
  const vals = xs.filter((x) => x >= 0);
  const n = vals.length;
  if (n === 0) return 0;
  const total = sum(vals);
  if (total === 0) return 0;
  const sorted = [...vals].sort((a, b) => a - b);
  let cumWeighted = 0;
  for (let i = 0; i < n; i++) cumWeighted += (i + 1) * sorted[i];
  // Formule de Gini pour données discrètes.
  return (2 * cumWeighted) / (n * total) - (n + 1) / n;
};

module.exports = {
  sum,
  mean,
  min,
  max,
  stdev,
  cv,
  percentile,
  summarize,
  gini,
};
