/**
 * ── Chapitre VI.II — Qualité (quantitative) de la génération de plans IA ──────
 *
 * Lance de VRAIS appels au modèle sur un jeu de documents de test et mesure :
 *   - Latence de génération (ms)
 *   - Consommation de tokens (entrée / sortie)
 *   - Validité du plan vis-à-vis du schéma (structured outputs)
 *   - Métriques structurelles : nb de tâches, taux de labels
 *   - Couverture thématique : % de mots-clés attendus présents dans le plan
 *
 * ⚠ Consomme des crédits API. Prérequis : ANTHROPIC_API_KEY dans backend/.env.
 *   node evaluation/bench/02-ai-generation.js
 *
 * Variables : EVAL_AI_RUNS (répétitions par document, déf. 1), EVAL_AI_MODEL.
 *
 * Écrit aussi results/ai-plans_latest.json (consommé par 04-ai-judge).
 */
const fs = require("fs");
const path = require("path");
const { generatePlan, analyzePlan } = require("../lib/ai-generate");
const documents = require("../fixtures/ai-documents");
const { summarize, mean } = require("../lib/stats");
const { fmt, markdownTable, printSection } = require("../lib/table");
const report = require("../lib/report");
const env = require("../lib/env");

const RUNS = parseInt(process.env.EVAL_AI_RUNS, 10) || 1;
// Limite optionnelle du nombre de documents (maîtrise du coût / smoke test).
const LIMIT = parseInt(process.env.EVAL_AI_LIMIT, 10) || documents.length;

// Catalogue de labels (optionnel) : reproduit fidèlement le prompt de prod.
const loadLabelNames = async () => {
  try {
    const prisma = require("../../src/prisma/client");
    const labels = await prisma.label.findMany({ select: { name: true } });
    await prisma.$disconnect();
    return labels.map((l) => l.name);
  } catch {
    return []; // base indisponible → catalogue vide (prompt reste valide)
  }
};

const main = async () => {
  console.log("═══ VI.II — Qualité de la génération de plans par l'IA ═══");
  if (!env.anthropicApiKey) {
    console.error("✗ ANTHROPIC_API_KEY absente du .env.");
    process.exit(1);
  }
  const labelNames = await loadLabelNames();
  console.log(
    `Modèle : ${env.aiModel} | ${documents.length} documents × ${RUNS} run(s) | ` +
      `${labelNames.length} labels au catalogue`,
  );

  const perDoc = [];
  const latencies = [];
  const inTokens = [];
  const outTokens = [];
  const coverages = [];
  const plansForJudge = [];
  let validCount = 0;
  let totalRuns = 0;

  for (const doc of documents.slice(0, LIMIT)) {
    const runMetrics = [];
    let lastPlan = null;
    for (let r = 0; r < RUNS; r++) {
      process.stdout.write(`  · ${doc.id} (run ${r + 1}/${RUNS})… `);
      const res = await generatePlan({ document: doc.document, labelNames });
      totalRuns++;
      if (!res.ok) {
        console.log(`échec: ${res.error}`);
        continue;
      }
      const usage = res.usage || {};
      const structure = analyzePlan(res.plan, doc.expectedThemes);
      if (res.valid) validCount++;
      latencies.push(res.ms);
      inTokens.push(usage.input_tokens || 0);
      outTokens.push(usage.output_tokens || 0);
      if (structure.themeCoverage != null) coverages.push(structure.themeCoverage);
      runMetrics.push({ ms: res.ms, usage, valid: res.valid, structure });
      lastPlan = res.plan;
      console.log(
        `${fmt(res.ms, 0)}ms, ${structure.tasks} tâches, ` +
          `couv ${fmt((structure.themeCoverage || 0) * 100, 0)}%`,
      );
    }
    if (lastPlan) {
      plansForJudge.push({
        id: doc.id,
        title: doc.title,
        document: doc.document,
        expectedThemes: doc.expectedThemes,
        plan: lastPlan,
      });
    }
    if (runMetrics.length) {
      const avgOf = (sel) => mean(runMetrics.map(sel));
      perDoc.push({
        id: doc.id,
        title: doc.title,
        size: doc.size,
        runs: runMetrics.length,
        ms: avgOf((m) => m.ms),
        inTok: avgOf((m) => m.usage.input_tokens || 0),
        outTok: avgOf((m) => m.usage.output_tokens || 0),
        tasks: avgOf((m) => m.structure.tasks),
        themeCoverage: avgOf((m) => m.structure.themeCoverage || 0),
        labelCoverage: avgOf((m) => m.structure.labelCoverage || 0),
        valid: runMetrics.every((m) => m.valid),
      });
    }
  }

  const rows = perDoc.map((d) => [
    d.id,
    d.size,
    fmt(d.ms, 0),
    fmt(d.inTok, 0),
    fmt(d.outTok, 0),
    fmt(d.tasks, 1),
    `${fmt(d.labelCoverage * 100, 0)}%`,
    `${fmt(d.themeCoverage * 100, 0)}%`,
    d.valid ? "✓" : "✗",
  ]);
  printSection(
    "Par document (moyenne des runs)",
    ["doc", "taille", "ms", "tok.in", "tok.out", "tâches", "labels", "couv.thème", "valide"],
    rows,
  );

  const latS = summarize(latencies);
  const validPct = totalRuns ? (validCount / totalRuns) * 100 : 0;
  const summaryRows = [
    ["Latence médiane (p50)", `${fmt(latS.p50, 0)} ms`],
    ["Latence p95", `${fmt(latS.p95, 0)} ms`],
    ["Tokens entrée (moy.)", fmt(mean(inTokens), 0)],
    ["Tokens sortie (moy.)", fmt(mean(outTokens), 0)],
    ["Validité schéma", `${fmt(validPct, 1)} % (${validCount}/${totalRuns})`],
    ["Couverture thématique (moy.)", `${fmt(mean(coverages) * 100, 1)} %`],
  ];
  printSection("Synthèse globale", ["métrique", "valeur"], summaryRows);

  // Persiste les plans pour l'évaluation qualitative (04-ai-judge).
  const plansPath = path.join(report.RESULTS_DIR, "ai-plans_latest.json");
  if (!fs.existsSync(report.RESULTS_DIR)) fs.mkdirSync(report.RESULTS_DIR, { recursive: true });
  fs.writeFileSync(plansPath, JSON.stringify({ model: env.aiModel, plans: plansForJudge }, null, 2));

  const md = [
    "# VI.II — Qualité de la génération de plans par l'IA (quantitatif)",
    "",
    `_Généré le ${new Date().toISOString()} — modèle ${env.aiModel}, ${RUNS} run(s)/doc_`,
    "",
    "## Synthèse",
    "",
    markdownTable(["métrique", "valeur"], summaryRows),
    "",
    "## Détail par document",
    "",
    markdownTable(
      ["doc", "taille", "latence ms", "tok. entrée", "tok. sortie", "tâches", "labels", "couv. thème", "valide"],
      rows,
    ),
    "",
  ].join("\n");

  const paths = report.save(
    "02-ai-generation",
    { model: env.aiModel, runs: RUNS, summary: { latency: latS, validPct, avgInTokens: mean(inTokens), avgOutTokens: mean(outTokens), avgCoverage: mean(coverages) }, perDoc },
    md,
  );
  console.log(`\n✓ Rapport écrit : ${paths.latestMd}`);
  console.log(`✓ Plans sauvegardés pour l'évaluation qualitative : ${plansPath}`);
};

main().catch((err) => {
  console.error("✗ Échec :", err.message);
  process.exit(1);
});
