const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");

const normalize = (name) => String(name ?? "").trim().toLowerCase();

const serialize = (l) => ({ id: l.id, name: l.name });

/** Annuaire des labels (tous les utilisateurs authentifiés peuvent lire). */
const listAll = async () => {
  const labels = await prisma.label.findMany({ orderBy: { name: "asc" } });
  return labels.map(serialize);
};

/** Ensemble des noms de labels valides (pour filtrer/valider ailleurs). */
const knownNames = async () => {
  const labels = await prisma.label.findMany({ select: { name: true } });
  return new Set(labels.map((l) => l.name));
};

/** Ne conserve que les labels présents dans le catalogue (normalisés). */
const filterToCatalog = async (labels) => {
  if (!Array.isArray(labels) || labels.length === 0) return [];
  const known = await knownNames();
  const seen = new Set();
  const out = [];
  for (const raw of labels) {
    const name = normalize(raw);
    if (name && known.has(name) && !seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  return out;
};

/** Création — réservée à l'admin (contrôle dans le contrôleur). */
const create = async (name) => {
  const normalized = normalize(name);
  if (!normalized) throw new AppError("Le nom du label est requis.", 400);
  const existing = await prisma.label.findUnique({ where: { name: normalized } });
  if (existing) throw new AppError("Ce label existe déjà.", 409);
  const label = await prisma.label.create({ data: { name: normalized } });
  return serialize(label);
};

const remove = async (id) => {
  await prisma.label.delete({ where: { id } }).catch(() => {
    throw new AppError("Label introuvable.", 404);
  });
  return { id };
};

module.exports = { listAll, knownNames, filterToCatalog, create, remove };
