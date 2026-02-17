const OpenAI = require("openai");
const prisma = require("../../prisma/client");
const config = require("../../config/env");
const AppError = require("../../utils/AppError");
const { aiPlanSchema } = require("./ai.schema");

const openai = new OpenAI({ apiKey: config.openaiApiKey });

const SYSTEM_PROMPT = `You are a project planning assistant. Given a feature document, break it down into a structured plan with Epics, Stories, and Tasks.

Return ONLY valid JSON in this exact format:
{
  "epics": [
    {
      "title": "Epic title",
      "description": "Epic description",
      "stories": [
        {
          "title": "Story title",
          "description": "Story description",
          "tasks": [
            {
              "title": "Task title",
              "description": "Task description"
            }
          ]
        }
      ]
    }
  ]
}`;

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
    createdAt: draft.createdAt.toISOString(),
    created_at: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
    updated_at: draft.updatedAt.toISOString(),
  };
};

const generatePlan = async (userId, { projectId, document }) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: document },
    ],
  });

  const raw = JSON.parse(completion.choices[0].message.content);
  const plan = aiPlanSchema.parse(raw);

  const draft = await prisma.aiDraft.create({
    data: {
      projectId,
      document,
      plan,
    },
  });

  return draft;
};

const getDraft = async (draftId, userId) => {
  const draft = await prisma.aiDraft.findUnique({
    where: { id: draftId },
    include: { project: true },
  });

  if (!draft || draft.project.ownerId !== userId) {
    throw new AppError("Draft not found", 404);
  }

  return draft;
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
          const task = await tx.task.create({
            data: {
              title: taskData.title,
              description: taskData.description || null,
              position: ti,
              storyId: story.id,
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

module.exports = { generatePlan, getDraft, listDrafts, approveDraft, rejectDraft, serializeDraft };
