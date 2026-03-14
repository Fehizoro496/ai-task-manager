const { z } = require('zod');

const createDMSchema = z.object({
  otherUserId: z.string().uuid(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

module.exports = { createDMSchema, sendMessageSchema };
