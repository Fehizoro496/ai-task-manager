const { z } = require('zod');

const createDMSchema = z.object({
  otherUserId: z.string().uuid(),
});

// Le contenu texte est optionnel dès lors que le message porte des pièces
// jointes (validé au niveau du service qui connaît les fichiers).
const sendMessageSchema = z.object({
  content: z.string().max(4000).optional().default(''),
});

module.exports = { createDMSchema, sendMessageSchema };
