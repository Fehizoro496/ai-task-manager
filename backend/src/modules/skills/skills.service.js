const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");

const normalize = (name) => String(name ?? "").trim().toLowerCase();
const clampLevel = (n) => Math.max(1, Math.min(5, Math.round(Number(n) || 3)));

const serializeUserSkill = (us) => ({
  skillId: us.skillId,
  name: us.skill?.name ?? null,
  level: us.level,
  source: us.source,
});

/** Annuaire global des compétences (pour l'autocomplétion côté front). */
const listAll = async () => {
  const skills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
  return skills.map((s) => ({ id: s.id, name: s.name }));
};

/** Compétences d'un utilisateur, manuelles + dérivées. */
const listForUser = async (userId) => {
  const rows = await prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true },
    orderBy: [{ level: "desc" }],
  });
  return rows.map(serializeUserSkill);
};

/** Crée la compétence si besoin et renvoie son id (nom normalisé, unique). */
const ensureSkill = async (name) => {
  const normalized = normalize(name);
  if (!normalized) return null;
  const skill = await prisma.skill.upsert({
    where: { name: normalized },
    update: {},
    create: { name: normalized },
  });
  return skill.id;
};

/**
 * Ajoute/maj une compétence manuelle pour un user. Le "manuel" prime
 * toujours sur le "dérivé" : on écrase la source en "manual".
 */
const addOrUpdate = async (userId, name, level) => {
  const skillId = await ensureSkill(name);
  if (!skillId) throw new AppError("Skill name is required", 400);

  await prisma.userSkill.upsert({
    where: { userId_skillId: { userId, skillId } },
    update: { level: clampLevel(level), source: "manual" },
    create: { userId, skillId, level: clampLevel(level), source: "manual" },
  });
  return listForUser(userId);
};

const remove = async (userId, skillId) => {
  await prisma.userSkill
    .delete({ where: { userId_skillId: { userId, skillId } } })
    .catch(() => {});
  return listForUser(userId);
};

/**
 * Bootstrap : déduit des compétences à partir des labels des tâches
 * terminées par chaque utilisateur. Ne touche jamais aux compétences
 * saisies manuellement (source = "manual").
 *
 * Niveau dérivé : 2 (1 tâche) → 5 (≥ 6 tâches sur ce label).
 */
const levelFromFrequency = (freq) => Math.max(2, Math.min(5, 1 + freq));

const bootstrapFromHistory = async (targetUserId = null) => {
  const tasks = await prisma.task.findMany({
    where: {
      status: "DONE",
      assigneeId: targetUserId ? targetUserId : { not: null },
    },
    select: { assigneeId: true, labels: true },
  });

  // freq[userId][label] = nombre de tâches terminées avec ce label
  const freq = new Map();
  for (const t of tasks) {
    if (!t.assigneeId) continue;
    const labels = Array.isArray(t.labels) ? t.labels : [];
    for (const raw of labels) {
      const label = normalize(raw);
      if (!label) continue;
      if (!freq.has(t.assigneeId)) freq.set(t.assigneeId, new Map());
      const m = freq.get(t.assigneeId);
      m.set(label, (m.get(label) ?? 0) + 1);
    }
  }

  let upserts = 0;
  for (const [userId, labelMap] of freq) {
    for (const [label, count] of labelMap) {
      const skillId = await ensureSkill(label);
      if (!skillId) continue;

      const existing = await prisma.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId } },
      });
      // On ne réécrit pas une compétence manuelle.
      if (existing && existing.source === "manual") continue;

      const level = levelFromFrequency(count);
      await prisma.userSkill.upsert({
        where: { userId_skillId: { userId, skillId } },
        update: { level, source: "derived" },
        create: { userId, skillId, level, source: "derived" },
      });
      upserts++;
    }
  }

  return { usersProcessed: freq.size, skillsUpserted: upserts };
};

module.exports = {
  normalize,
  listAll,
  listForUser,
  addOrUpdate,
  remove,
  bootstrapFromHistory,
};
