/**
 * Charge le .env du backend quel que soit le cwd d'invocation, puis expose
 * la config d'exécution des benchmarks (surchargée par variables d'env).
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

module.exports = {
  // Serveur backend cible pour les benchmarks HTTP / temps réel.
  apiUrl: process.env.EVAL_API_URL || "http://localhost:3000",
  // Compte utilisé pour signer un JWT de test (doit exister en base, APPROVED).
  adminEmail:
    process.env.EVAL_USER_EMAIL || "fehizoroandriantsarafara@gmail.com",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  anthropicApiKey:
    process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
  // Modèle IA (par défaut celui du service). Surchargeable pour comparer.
  aiModel: process.env.EVAL_AI_MODEL || "claude-sonnet-4-6",
};
