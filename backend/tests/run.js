/**
 * Lanceur des tests d'intégration.
 *
 * Les tests tapent dans un vrai Postgres — `listForUser` s'appuie sur du SQL
 * brut (CASE de priorité, NULLS LAST, ILIKE), qu'aucun mock ne reproduirait
 * fidèlement. Pour ne jamais toucher aux données de développement, ils tournent
 * dans un **schéma dédié** de la même base : l'URL de connexion est recopiée en
 * remplaçant `schema=public` par `schema=test_…`.
 *
 *   npm test                    → toute la suite
 *   npm test tests/x.test.js    → un fichier
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

require("dotenv").config();

const TEST_SCHEMA = process.env.TEST_DB_SCHEMA || "test_ai_task_manager";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL manquante : renseignez-la dans backend/.env");
  process.exit(1);
}

const url = new URL(process.env.DATABASE_URL);
url.searchParams.set("schema", TEST_SCHEMA);

const env = {
  ...process.env,
  DATABASE_URL: url.toString(),
  NODE_ENV: "test",
  // Les tests signent leurs propres JWT : un secret suffit, peu importe lequel.
  JWT_SECRET: process.env.JWT_SECRET || "test-secret",
};

console.log(`→ base de test : ${url.pathname.slice(1)} (schéma « ${TEST_SCHEMA} »)`);

// Aligne le schéma de test sur schema.prisma. `--accept-data-loss` ne concerne
// que ce schéma jetable, jamais celui de développement.
const push = spawnSync(
  "npx",
  ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
  { env, stdio: "inherit", shell: true, cwd: path.join(__dirname, "..") },
);
if (push.status !== 0) {
  console.error("Échec de `prisma db push` sur la base de test.");
  process.exit(push.status ?? 1);
}

const targets = process.argv.slice(2);
const result = spawnSync(
  process.execPath,
  // Séquentiel : tous les fichiers partagent le même schéma de test et le
  // vident entre les scénarios.
  ["--test", "--test-concurrency=1", ...(targets.length > 0 ? targets : ["tests/**/*.test.js"])],
  { env, stdio: "inherit", cwd: path.join(__dirname, "..") },
);
process.exit(result.status ?? 1);
