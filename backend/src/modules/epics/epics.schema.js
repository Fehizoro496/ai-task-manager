const { z } = require("zod");

const createEpicSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().uuid(),
  position: z.number().int().optional(),
});

const updateEpicSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  position: z.number().int().optional(),
});

module.exports = { createEpicSchema, updateEpicSchema };
