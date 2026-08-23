const prisma = require("../../src/prisma/client");

/**
 * Garde-fou : les tests vident les tables, cette opération ne doit jamais
 * s'exécuter ailleurs que dans le schéma jetable préparé par `tests/run.js`.
 */
const assertTestSchema = async () => {
  const [{ schema }] = await prisma.$queryRaw`SELECT current_schema() AS schema`;
  if (!schema || !schema.startsWith("test")) {
    throw new Error(
      `Refus de tourner hors schéma de test (current_schema() = « ${schema} »). ` +
        "Lancez la suite via `npm test`, qui isole la base.",
    );
  }
  return schema;
};

let truncateStatement = null;

/** Vide toutes les tables du schéma de test entre deux scénarios. */
const resetDb = async () => {
  await assertTestSchema();

  if (!truncateStatement) {
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables
      WHERE schemaname = current_schema() AND tablename NOT LIKE '\\_prisma%'
    `;
    if (tables.length === 0) {
      throw new Error("Aucune table dans le schéma de test : `prisma db push` a-t-il tourné ?");
    }
    // CASCADE règle l'ordre des dépendances, inutile de trier les tables.
    truncateStatement = `TRUNCATE TABLE ${tables
      .map((t) => `"${t.tablename}"`)
      .join(", ")} RESTART IDENTITY CASCADE`;
  }

  await prisma.$executeRawUnsafe(truncateStatement);
};

const disconnect = () => prisma.$disconnect();

module.exports = { prisma, resetDb, assertTestSchema, disconnect };
