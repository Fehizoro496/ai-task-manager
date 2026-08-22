const { z } = require("zod");

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  githubRepoUrl: z.string().url().optional(),
  identifierPrefix: z.string().min(1).max(10).optional(),
  // Création automatique du dépôt GitHub (ignorée si githubRepoUrl est fourni).
  createGithubRepo: z.boolean().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  githubRepoUrl: z.string().url().nullable().optional(),
  identifierPrefix: z.string().min(1).max(10).optional(),
});

module.exports = { createProjectSchema, updateProjectSchema };
