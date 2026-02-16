const { z } = require("zod");

const createStorySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  epicId: z.string().uuid(),
  position: z.number().int().optional(),
});

const updateStorySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  position: z.number().int().optional(),
});

module.exports = { createStorySchema, updateStorySchema };
