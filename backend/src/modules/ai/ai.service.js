const Anthropic = require("@anthropic-ai/sdk");
const prisma = require("../../prisma/client");
const config = require("../../config/env");
const AppError = require("../../utils/AppError");
const { aiPlanSchema } = require("./ai.schema");
const labelsService = require("../labels/labels.service");

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

// Construit la consigne de labels injectée dans le prompt : l'IA ne doit
// utiliser QUE les labels du catalogue (géré par l'admin).
const buildLabelsDirective = async () => {
  const names = [...(await labelsService.knownNames())].sort();
  if (names.length === 0) {
    return "- N'ajoute AUCUN label aux tâches (le catalogue de labels est vide).";
  }
  return `- Pour chaque tâche, ajoute 1 à 3 "labels" choisis EXCLUSIVEMENT dans cette liste (n'invente jamais de nouveau label) : ${names.join(
    ", ",
  )}.`;
};

const SYSTEM_PROMPT = `Tu es un assistant de planification de projet. À partir d'un document de fonctionnalités, décompose-le en un plan structuré d'Epics, contenant chacun des Stories, contenant chacune des Tâches.

- Les Epics sont des thèmes de haut niveau ; les Stories des incréments orientés utilisateur ; les Tâches des unités de travail concrètes et actionnables.
- Rédige TOUT le contenu (titres et descriptions) en français.
- Ton : TOUJOURS concis. Titres courts à l'impératif, une phrase courte maximum par description, sans remplissage.
- Couvre le document de manière exhaustive sans inventer de périmètre non implicite.`;

// JSON Schema utilisé pour les structured outputs (équivalent de aiPlanSchema).
// Écrit à la main pour éviter le couplage avec la version de zod (le helper
// zodOutputFormat du SDK exige des schémas zod v4).
const titleDescObject = (required, extraProps = {}) => ({
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    ...extraProps,
  },
  required,
  additionalProperties: false,
});

const PLAN_JSON_SCHEMA = {
  type: "object",
  properties: {
    epics: {
      type: "array",
      items: titleDescObject(["title", "stories"], {
        stories: {
          type: "array",
          items: titleDescObject(["title", "tasks"], {
            tasks: {
              type: "array",
              items: titleDescObject(["title"], {
                labels: { type: "array", items: { type: "string" } },
              }),
            },
          }),
        },
      }),
    },
  },
  required: ["epics"],
  additionalProperties: false,
};

/**
 * Serializes a Prisma AiDraft into the format expected by the Flutter frontend.
 * Frontend expects snake_case keys and specific field names.
 */
const serializeDraft = (draft) => {
  let status = "pending";
  if (draft.approved) {
    status = "approved";
  } else if (draft.plan && Object.keys(draft.plan).length > 0) {
    status = "generated";
  }

  return {
    id: draft.id,
    projectId: draft.projectId,
    project_id: draft.projectId,
    document: draft.document,
    input_document: draft.document,
    plan: draft.plan,
    generated_plan: draft.plan,
    approved: draft.approved,
    status,
    messages: (draft.messages ?? []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    createdAt: draft.createdAt.toISOString(),
    created_at: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
    updated_at: draft.updatedAt.toISOString(),
  };
};

// Inclusion standard des messages (fil de discussion) pour les lectures.
const draftWithMessages = {
  messages: { orderBy: { createdAt: "asc" } },
};

const generatePlan = async (userId, { projectId, document }) => {
  // Un brouillon est rattaché à un projet (FK obligatoire) : on exige donc
  // un projectId, sinon `findFirst({ id: undefined })` matcherait au hasard.
  if (!projectId) {
    throw new AppError("Un projet doit être sélectionné pour générer un plan.", 400);
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const labelsDirective = await buildLabelsDirective();

  // Structured outputs : la réponse est contrainte au JSON Schema du plan,
  // donc garantie parseable. Adaptive thinking améliore la décomposition.
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
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

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) {
    throw new AppError("AI plan generation failed", 502);
  }
  // Re-validation côté serveur avec le schéma zod existant (défense en profondeur).
  const plan = aiPlanSchema.parse(JSON.parse(textBlock.text));

  const draft = await prisma.aiDraft.create({
    data: {
      projectId: project.id,
      document,
      plan,
    },
  });

  return draft;
};

const getDraft = async (draftId, userId) => {
  const draft = await prisma.aiDraft.findUnique({
    where: { id: draftId },
    include: { project: true, ...draftWithMessages },
  });

  if (!draft || draft.project.ownerId !== userId) {
    throw new AppError("Draft not found", 404);
  }

  return draft;
};

const REFINE_SYSTEM_PROMPT = `Tu raffines un plan de projet EXISTANT composé d'Epics → Stories → Tâches.

- Tu reçois le plan actuel (JSON), le brief initial et une instruction.
- Applique l'instruction et renvoie le plan révisé COMPLET dans la même structure.
- Rédige tout le contenu en français, sur un ton concis.
- Conserve à l'identique toute partie non concernée par l'instruction (mêmes titres/descriptions).
- Ne supprime aucun contenu existant sauf si l'instruction le demande.`;

/**
 * Raffine un brouillon existant via une instruction en langage naturel.
 * Stateless côté IA : on renvoie le plan courant + l'instruction, l'IA
 * retourne le plan complet révisé. La discussion est persistée.
 */
const refineDraft = async (draftId, userId, instruction) => {
  const text = (instruction ?? "").trim();
  if (!text) throw new AppError("Une instruction est requise.", 400);

  const draft = await prisma.aiDraft.findUnique({
    where: { id: draftId },
    include: { project: true, ...draftWithMessages },
  });
  if (!draft || draft.project.ownerId !== userId) {
    throw new AppError("Draft not found", 404);
  }
  if (draft.approved) {
    throw new AppError("Draft already approved", 400);
  }

  const userContent = `Brief initial :\n${draft.document}\n\nPlan actuel (JSON) :\n${JSON.stringify(
    draft.plan,
  )}\n\nInstruction :\n${text}`;

  const labelsDirective = await buildLabelsDirective();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: `${REFINE_SYSTEM_PROMPT}\n${labelsDirective}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
    output_config: { format: { type: "json_schema", schema: PLAN_JSON_SCHEMA } },
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block) throw new AppError("AI plan refinement failed", 502);
  const revisedPlan = aiPlanSchema.parse(JSON.parse(block.text));

  // Persiste le tour de discussion + le plan révisé.
  const [updated] = await prisma.$transaction([
    prisma.aiDraft.update({
      where: { id: draftId },
      data: {
        plan: revisedPlan,
        messages: {
          create: [
            { role: "user", content: text },
            { role: "assistant", content: "Plan révisé." },
          ],
        },
      },
      include: { project: true, ...draftWithMessages },
    }),
  ]);

  return updated;
};

const listDrafts = async (projectId, userId) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return prisma.aiDraft.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
};

const approveDraft = async (draftId, userId) => {
  const draft = await prisma.aiDraft.findUnique({
    where: { id: draftId },
    include: { project: true },
  });

  if (!draft || draft.project.ownerId !== userId) {
    throw new AppError("Draft not found", 404);
  }

  if (draft.approved) {
    throw new AppError("Draft already approved", 400);
  }

  const plan = draft.plan;
  // Catalogue de labels valides : on ignore tout label hors catalogue.
  const knownLabels = await labelsService.knownNames();

  const result = await prisma.$transaction(async (tx) => {
    const createdEpics = [];

    for (let ei = 0; ei < plan.epics.length; ei++) {
      const epicData = plan.epics[ei];
      const epic = await tx.epic.create({
        data: {
          title: epicData.title,
          description: epicData.description || null,
          position: ei,
          projectId: draft.projectId,
        },
      });

      const createdStories = [];

      for (let si = 0; si < epicData.stories.length; si++) {
        const storyData = epicData.stories[si];
        const story = await tx.story.create({
          data: {
            title: storyData.title,
            description: storyData.description || null,
            position: si,
            epicId: epic.id,
          },
        });

        const createdTasks = [];

        for (let ti = 0; ti < storyData.tasks.length; ti++) {
          const taskData = storyData.tasks[ti];
          // Génère un identifiant unique (ex. AM-001) en incrémentant le
          // compteur du projet, comme le fait la création de tâche normale.
          const counter = await tx.project.update({
            where: { id: draft.projectId },
            data: { taskCounter: { increment: 1 } },
            select: { taskCounter: true, identifierPrefix: true },
          });
          const identifier = `${counter.identifierPrefix}-${String(
            counter.taskCounter,
          ).padStart(3, "0")}`;
          const task = await tx.task.create({
            data: {
              title: taskData.title,
              description: taskData.description || null,
              position: ti,
              storyId: story.id,
              identifier,
              githubBranch: identifier,
              labels: Array.isArray(taskData.labels)
                ? taskData.labels
                    .map((l) => String(l).trim().toLowerCase())
                    .filter((l) => knownLabels.has(l))
                : [],
            },
          });
          createdTasks.push(task);
        }

        createdStories.push({ ...story, tasks: createdTasks });
      }

      createdEpics.push({ ...epic, stories: createdStories });
    }

    await tx.aiDraft.update({
      where: { id: draftId },
      data: { approved: true },
    });

    return createdEpics;
  });

  return result;
};

const rejectDraft = async (draftId, userId) => {
  const draft = await prisma.aiDraft.findUnique({
    where: { id: draftId },
    include: { project: true },
  });

  if (!draft || draft.project.ownerId !== userId) {
    throw new AppError("Draft not found", 404);
  }

  await prisma.aiDraft.delete({
    where: { id: draftId },
  });
};

module.exports = { generatePlan, getDraft, listDrafts, approveDraft, rejectDraft, refineDraft, serializeDraft };
