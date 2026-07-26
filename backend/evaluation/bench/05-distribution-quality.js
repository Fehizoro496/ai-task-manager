/**
 * ── Chapitre VII.II — Évaluation qualitative de la répartition ───────────────
 *
 * Au-delà du coût brut (VI.III), on juge la QUALITÉ des affectations selon
 * trois critères métier, en comparant l'algorithme hongrois à deux baselines :
 *   - "compétence seule" (assigne au plus compétent, ignore la charge),
 *   - "aléatoire".
 *
 * Critères :
 *   - Adéquation compétence moyenne (tâche ↔ membre)   ↑ mieux
 *   - Score de compatibilité global moyen              ↑ mieux
 *   - Équilibrage de charge : Gini + écart max-min      ↓ mieux
 *
 * 100 % hors-ligne :  node evaluation/bench/05-distribution-quality.js
 */
const {
  makeTeam,
  makeBacklog,
  assignHungarian,
  assignBestSkill,
  assignRandom,
  loadsPerMember,
  avgSkillFit,
  avgScore,
} = require("../fixtures/distribution");
const { gini, cv, mean, min, max } = require("../lib/stats");
const { fmt, markdownTable, printSection } = require("../lib/table");
const report = require("../lib/report");

const STRATS = {
  "Hongrois (optimal)": (team, backlog) => assignHungarian(team, backlog).memberOf,
  "Compétence seule": (team, backlog) => assignBestSkill(team, backlog).memberOf,
  Aléatoire: (team, backlog, seed) => assignRandom(team, backlog, seed).memberOf,
};

const evalStrategy = (team, backlog, memberOf) => {
  const loads = loadsPerMember(team, backlog, memberOf);
  return {
    skillFit: avgSkillFit(team, backlog, memberOf),
    score: avgScore(team, backlog, memberOf),
    giniLoad: gini(loads),
    cvLoad: cv(loads),
    spread: max(loads) - min(loads),
    loads,
  };
};

const SCENARIOS = [
  { name: "Petite équipe", members: 4, tasks: 15, seed: 11 },
  { name: "Équipe moyenne", members: 8, tasks: 40, seed: 22 },
  { name: "Grande équipe", members: 12, tasks: 80, seed: 33 },
  { name: "Surcharge (peu de membres)", members: 3, tasks: 45, seed: 44 },
];

const main = () => {
  console.log("═══ VII.II — Évaluation qualitative de la répartition ═══");

  const perScenario = [];
  // Agrégat par stratégie (moyenne sur scénarios) pour le tableau de synthèse.
  const agg = Object.fromEntries(
    Object.keys(STRATS).map((k) => [k, { skillFit: [], score: [], gini: [], spread: [] }]),
  );

  for (const sc of SCENARIOS) {
    const team = makeTeam(sc.members, sc.seed);
    const backlog = makeBacklog(sc.tasks, sc.seed);
    const rows = [];
    const results = {};
    for (const [name, fn] of Object.entries(STRATS)) {
      const memberOf = fn(team, backlog, sc.seed);
      const m = evalStrategy(team, backlog, memberOf);
      results[name] = m;
      agg[name].skillFit.push(m.skillFit);
      agg[name].score.push(m.score);
      agg[name].gini.push(m.giniLoad);
      agg[name].spread.push(m.spread);
      rows.push([
        name,
        fmt(m.skillFit, 3),
        fmt(m.score, 3),
        fmt(m.giniLoad, 3),
        fmt(m.spread, 1),
      ]);
    }
    printSection(
      `Scénario « ${sc.name} » (${sc.members} membres, ${sc.tasks} tâches)`,
      ["stratégie", "adéq. compét.", "score moyen", "Gini charge", "écart max-min"],
      rows,
    );
    perScenario.push({ scenario: sc, results });
  }

  // ── Synthèse (moyennes sur tous les scénarios) ─────────────────────────────
  const synthRows = Object.entries(agg).map(([name, a]) => [
    name,
    fmt(mean(a.skillFit), 3),
    fmt(mean(a.score), 3),
    fmt(mean(a.gini), 3),
    fmt(mean(a.spread), 1),
  ]);
  printSection(
    "Synthèse (moyenne sur les 4 scénarios)",
    ["stratégie", "adéq. compét.", "score moyen", "Gini charge", "écart max-min"],
    synthRows,
  );

  const md = [
    "# VII.II — Évaluation qualitative de la répartition automatique",
    "",
    `_Généré le ${new Date().toISOString()}_`,
    "",
    "Comparaison de l'algorithme hongrois à deux baselines. **Adéquation** et",
    "**score** : plus haut = meilleur. **Gini** et **écart max-min** (équilibrage",
    "de charge) : plus bas = meilleur.",
    "",
    "## Synthèse (moyenne sur 4 scénarios)",
    "",
    markdownTable(
      ["stratégie", "adéq. compétence", "score moyen", "Gini charge", "écart max-min"],
      synthRows,
    ),
    "",
    "## Détail par scénario",
    "",
    ...perScenario.flatMap(({ scenario, results }) => [
      `### ${scenario.name} — ${scenario.members} membres, ${scenario.tasks} tâches`,
      "",
      markdownTable(
        ["stratégie", "adéq. compétence", "score moyen", "Gini charge", "écart max-min"],
        Object.entries(results).map(([name, m]) => [
          name,
          fmt(m.skillFit, 3),
          fmt(m.score, 3),
          fmt(m.giniLoad, 3),
          fmt(m.spread, 1),
        ]),
      ),
      "",
    ]),
  ].join("\n");

  const paths = report.save(
    "05-distribution-quality",
    { perScenario: perScenario.map((p) => ({ scenario: p.scenario, results: p.results })) },
    md,
  );
  console.log(`\n✓ Rapport écrit : ${paths.latestMd}`);
};

main();
