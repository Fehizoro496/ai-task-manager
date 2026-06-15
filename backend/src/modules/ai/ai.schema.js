const { z } = require("zod");

const planRequestSchema = z
  .object({
    projectId: z.string().uuid().optional(),
    project_id: z.string().uuid().optional(),
    document: z.string().min(1),
  })
  .transform((data) => ({
    projectId: data.projectId || data.project_id,
    document: data.document,
  }));

const aiTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  labels: z.array(z.string()).optional(),
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
