/**
 * Algorithme hongrois (Kuhn-Munkres) — résolution exacte du problème
 * d'affectation : affecter n lignes à n colonnes en minimisant le coût
 * total, en O(n³). Implémentation par la méthode des potentiels.
 *
 * @param {number[][]} cost  matrice carrée n×n de coûts (≥ 0 conseillé)
 * @returns {number[]} assignment  assignment[ligne] = colonne choisie
 */
function hungarian(cost) {
  const n = cost.length;
  if (n === 0) return [];
  const INF = Infinity;

  // Tableaux 1-indexés (convention classique de l'algorithme).
  const u = new Array(n + 1).fill(0); // potentiels lignes
  const v = new Array(n + 1).fill(0); // potentiels colonnes
  const p = new Array(n + 1).fill(0); // p[col] = ligne affectée à col
  const way = new Array(n + 1).fill(0); // reconstruction du chemin

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(INF);
    const used = new Array(n + 1).fill(false);

    // Recherche d'un chemin augmentant à coût réduit minimal.
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF;
      let j1 = -1;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    // Application du chemin augmentant.
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }

  const assignment = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) {
    if (p[j] >= 1) assignment[p[j] - 1] = j - 1;
  }
  return assignment;
}

module.exports = { hungarian };
