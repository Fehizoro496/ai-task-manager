const { z } = require("zod");

const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

module.exports = { createCommentSchema };
