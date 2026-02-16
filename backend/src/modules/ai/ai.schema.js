const { z } = require("zod");

const planRequestSchema = z.object({
  projectId: z.string().uuid(),
  document: z.string().min(1),
});

const aiTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

const aiStorySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  tasks: z.array(aiTaskSchema),
});

const aiEpicSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  stories: z.array(aiStorySchema),
});

const aiPlanSchema = z.object({
  epics: z.array(aiEpicSchema),
});

module.exports = { planRequestSchema, aiPlanSchema };
