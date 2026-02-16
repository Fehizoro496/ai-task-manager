const { z } = require("zod");

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  storyId: z.string().uuid(),
  position: z.number().int().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  position: z.number().int().optional(),
});

module.exports = { createTaskSchema, updateTaskSchema };
