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

const aiPlanSchema = z.object({
  tasks: z.array(aiTaskSchema),
});

module.exports = { planRequestSchema, aiPlanSchema };
