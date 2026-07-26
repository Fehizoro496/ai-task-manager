/**
 * Génération de plan IA instrumentée — miroir fidèle de `ai.service.generatePlan`
 * (mêmes prompt, modèle, JSON Schema, validation zod), mais SANS écriture en base :
 * on isole l'appel au LLM pour mesurer latence, tokens, validité et structure.
 *
 * Toute divergence avec ai.service fausserait l'évaluation : garder synchronisé.
 */
const Anthropic = require("@anthropic-ai/sdk");
const { performance } = require("perf_hooks");
const env = require("./env");
const { aiPlanSchema } = require("../../src/modules/ai/ai.schema");

const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });

// ── Copie du prompt système de ai.service (à garder identique) ────────────────
const SYSTEM_PROMPT = `Tu es un assistant de planification de projet. À partir d'un document de fonctionnalités, décompose-le en une liste de Tâches concrètes et actionnables.

- Les Tâches sont des unités de travail concrètes et actionnables.
- Rédige TOUT le contenu (titres et descriptions) en français.
- Ton : TOUJOURS concis. Titres courts à l'impératif, une phrase courte maximum par description, sans remplissage.
- Couvre le document de manière exhaustive sans inventer de périmètre non implicite.`;

const titleDescObject = (required, extraProps = {}) => ({
  type: "object",
  properties: { title: { type: "string" }, description: { type: "string" }, ...extraProps },
  required,
  additionalProperties: false,
});

const PLAN_JSON_SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: titleDescObject(["title"], {
        labels: { type: "array", items: { type: "string" } },
      }),
    },
  },
  required: ["tasks"],
  additionalProperties: false,
};

const buildLabelsDirective = (labelNames = []) => {
  const names = [...labelNames].sort();
  if (names.length === 0) {
    return "- N'ajoute AUCUN label aux tâches (le catalogue de labels est vide).";
  }
  return `- Pour chaque tâche, ajoute 1 à 3 "labels" choisis EXCLUSIVEMENT dans cette liste (n'invente jamais de nouveau label) : ${names.join(
    ", ",
  )}.`;
};

/**
 * Appelle réellement le LLM pour générer un plan.
 * @returns {Promise<{ok,ms,plan,rawText,usage,valid,error}>}
 */
const generatePlan = async ({ document, labelNames = [], model = env.aiModel }) => {
  const labelsDirective = buildLabelsDirective(labelNames);
  const t0 = performance.now();
  let response;
  try {
    response = await anthropic.messages.create({
      model,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: `${SYSTEM_PROMPT}\n${labelsDirective}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: document }],
      output_config: { format: { type: "json_schema", schema: PLAN_JSON_SCHEMA } },
    });
  } catch (err) {
    return { ok: false, ms: performance.now() - t0, error: err.message };
  }
  const ms = performance.now() - t0;

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) {
    return { ok: false, ms, error: "Réponse sans bloc texte", usage: response.usage };
  }

  let plan = null;
  let valid = false;
  let error = null;
  try {
    plan = aiPlanSchema.parse(JSON.parse(textBlock.text));
    valid = true;
  } catch (err) {
    error = err.message;
  }

  return {
    ok: true,
    ms,
    plan,
    rawText: textBlock.text,
    usage: response.usage, // { input_tokens, output_tokens, ... }
    valid,
    error,
  };
};

/**
 * Métriques structurelles d'un plan généré (liste plate de tâches).
 * `expectedThemes` (mots-clés attendus du brief) → taux de couverture.
 */
const analyzePlan = (plan, expectedThemes = []) => {
  if (!plan || !Array.isArray(plan.tasks)) {
    return { tasks: 0 };
  }
  const tasks = plan.tasks.length;
  let tasksWithLabels = 0;
  const haystack = JSON.stringify(plan).toLowerCase();

  for (const t of plan.tasks) {
    if (Array.isArray(t.labels) && t.labels.length > 0) tasksWithLabels++;
  }

  const coveredThemes = expectedThemes.filter((kw) =>
    haystack.includes(kw.toLowerCase()),
  );

  return {
    tasks,
    tasksWithLabels,
    labelCoverage: tasks ? tasksWithLabels / tasks : 0,
    themeCoverage: expectedThemes.length
      ? coveredThemes.length / expectedThemes.length
      : null,
    coveredThemes,
    missingThemes: expectedThemes.filter((kw) => !haystack.includes(kw.toLowerCase())),
  };
};

module.exports = { generatePlan, analyzePlan, SYSTEM_PROMPT };
