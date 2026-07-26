/**
 * ── Chapitre VII.I — Évaluation qualitative de la génération de plans IA ──────
 *
 * Notation automatique par un LLM-juge (LLM-as-judge) : pour chaque couple
 * (document, plan généré), un modèle évalue le plan sur 5 critères notés 1 à 5,
 * via structured outputs (notation reproductible et parseable) :
 *   - fidélité       : le plan reflète-t-il fidèlement le document ?
 *   - granularité    : le découpage en tâches est-il pertinent ?
 *   - couverture     : toutes les fonctionnalités sont-elles couvertes ?
 *   - actionnabilité : les tâches sont-elles concrètes et réalisables ?
 *   - cohérence      : la liste est-elle logique et sans doublon ?
 *
 * ⚠ Consomme des crédits API. Nécessite d'avoir lancé 02-ai-generation avant
 *   (lit results/ai-plans_latest.json).
 *   node evaluation/bench/04-ai-judge.js
 *
 * Variables : EVAL_JUDGE_MODEL (déf. = EVAL_AI_MODEL).
 */
const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const { mean } = require("../lib/stats");
const { fmt, markdownTable, printSection } = require("../lib/table");
const report = require("../lib/report");
const env = require("../lib/env");

const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL || env.aiModel;
const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });

const CRITERIA = ["fidelite", "granularite", "couverture", "actionnabilite", "coherence"];

const JUDGE_SCHEMA = {
  type: "object",
  properties: {
    ...Object.fromEntries(
      CRITERIA.map((c) => [c, { type: "integer", enum: [1, 2, 3, 4, 5] }]),
    ),
    justification: { type: "string" },
  },
  required: [...CRITERIA, "justification"],
  additionalProperties: false,
};

const JUDGE_SYSTEM = `Tu es un évaluateur expert en gestion de projet agile. On te donne un
document de fonctionnalités et un plan (liste de Tâches) généré par une IA
à partir de ce document. Note le plan de 1 (très insuffisant) à 5 (excellent) sur
chaque critère, avec exigence et honnêteté :
- fidelite : le plan reflète fidèlement le contenu du document, sans hors-sujet.
- granularite : le découpage en tâches est pertinent et bien dimensionné (ni trop gros, ni trop fin).
- couverture : toutes les fonctionnalités décrites sont couvertes, aucune n'est oubliée.
- actionnabilite : les tâches sont concrètes, actionnables et non vagues.
- coherence : la liste est logique, sans doublon ni incohérence.
Fournis une justification courte (2-3 phrases).`;

const judgePlan = async (doc) => {
  const userContent = `DOCUMENT :\n${doc.document}\n\nPLAN GÉNÉRÉ (JSON) :\n${JSON.stringify(
    doc.plan,
  )}`;
  const response = await anthropic.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 2000,
    system: JUDGE_SYSTEM,
    messages: [{ role: "user", content: userContent }],
    output_config: { format: { type: "json_schema", schema: JUDGE_SCHEMA } },
  });
  const block = response.content.find((b) => b.type === "text");
  return JSON.parse(block.text);
};

const main = async () => {
  console.log("═══ VII.I — Évaluation qualitative de la génération IA (LLM-juge) ═══");
  if (!env.anthropicApiKey) {
    console.error("✗ ANTHROPIC_API_KEY absente du .env.");
    process.exit(1);
  }
  const plansPath = path.join(report.RESULTS_DIR, "ai-plans_latest.json");
  if (!fs.existsSync(plansPath)) {
    console.error("✗ results/ai-plans_latest.json introuvable. Lance d'abord : node evaluation/bench/02-ai-generation.js");
    process.exit(1);
  }
  const { plans } = JSON.parse(fs.readFileSync(plansPath, "utf8"));
  console.log(`Juge : ${JUDGE_MODEL} | ${plans.length} plans à évaluer`);

  const scores = [];
  const rows = [];
  for (const doc of plans) {
    process.stdout.write(`  · ${doc.id}… `);
    try {
      const s = await judgePlan(doc);
      scores.push({ id: doc.id, ...s });
      const avg = mean(CRITERIA.map((c) => s[c]));
      rows.push([doc.id, ...CRITERIA.map((c) => s[c]), fmt(avg, 2)]);
      console.log(`moyenne ${fmt(avg, 2)}/5`);
    } catch (e) {
      console.log(`échec: ${e.message}`);
    }
  }

  printSection(
    "Notes par document (1 à 5)",
    ["doc", ...CRITERIA.map((c) => c.slice(0, 6)), "moy."],
    rows,
  );

  // Moyenne par critère + globale.
  const byCriterion = CRITERIA.map((c) => [c, fmt(mean(scores.map((s) => s[c])), 2)]);
  const globalMean = mean(scores.flatMap((s) => CRITERIA.map((c) => s[c])));
  byCriterion.push(["**Moyenne globale**", fmt(globalMean, 2)]);
  printSection("Moyenne par critère (sur tous les documents)", ["critère", "note /5"], byCriterion);

  const md = [
    "# VII.I — Évaluation qualitative de la génération de plans par l'IA",
    "",
    `_Généré le ${new Date().toISOString()} — juge : ${JUDGE_MODEL}_`,
    "",
    "Notation LLM-as-judge sur 5 critères (échelle 1 à 5).",
    "",
    "## Moyenne par critère",
    "",
    markdownTable(["critère", "note /5"], byCriterion),
    "",
    "## Détail par document",
    "",
    markdownTable(["doc", ...CRITERIA, "moyenne"], rows),
    "",
    "## Justifications",
    "",
    ...scores.map((s) => `- **${s.id}** : ${s.justification}`),
    "",
  ].join("\n");

  const paths = report.save(
    "04-ai-judge",
    { judgeModel: JUDGE_MODEL, globalMean, scores },
    md,
  );
  console.log(`\n✓ Rapport écrit : ${paths.latestMd}`);
};

main().catch((err) => {
  console.error("✗ Échec :", err.message);
  process.exit(1);
});
