/**
 * Consolidation d'un plan IA renvoyé par le modèle.
 *
 * Le raffinage est stateless : on renvoie le plan courant au modèle qui doit
 * réémettre le plan COMPLET. Deux dérives sont fréquentes et se corrigent ici :
 *  - il réécrit une tâche sans sa description (le champ revient vide) ;
 *  - il réémet une tâche déjà présente sous un titre à peine différent,
 *    ce qui fait enfler le plan en doublons au fil des affinages.
 */

/**
 * Clé de comparaison d'un titre : insensible à la casse, aux accents et à la
 * ponctuation, pour rapprocher « Configurer le CI » et « configurer le CI. ».
 */
const normalizeTitle = (title) =>
  String(title ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Renvoie le texte nettoyé, ou `undefined` si vide (la clé sera absente du JSON). */
const cleanText = (value) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : undefined;
};

const cleanLabels = (labels) =>
  Array.isArray(labels)
    ? [...new Set(labels.map((l) => String(l).trim().toLowerCase()).filter(Boolean))]
    : [];

/** Construit une tâche de plan en omettant les champs vides. */
const makeTask = ({ title, description, labels }) => {
  const task = { title };
  if (description !== undefined) task.description = description;
  if (labels.length > 0) task.labels = labels;
  return task;
};

/** Réunit deux versions d'une même tâche sans rien perdre. */
const mergeTasks = (base, extra) =>
  makeTask({
    title: base.title,
    // La description la plus fournie l'emporte : une tâche ne doit jamais
    // perdre son détail au profit d'un doublon rédigé à la va-vite.
    description:
      (extra.description?.length ?? 0) > (base.description?.length ?? 0)
        ? extra.description
        : base.description,
    labels: [...new Set([...cleanLabels(base.labels), ...cleanLabels(extra.labels)])],
  });

/**
 * Normalise un plan : titres non vides, descriptions/labels nettoyés, et une
 * seule entrée par unité de travail (les doublons de titre sont fusionnés).
 */
const dedupeTasks = (tasks) => {
  const byTitle = new Map();

  for (const task of Array.isArray(tasks) ? tasks : []) {
    const title = cleanText(task?.title);
    if (!title) continue;

    const normalized = makeTask({
      title,
      description: cleanText(task?.description),
      labels: cleanLabels(task?.labels),
    });

    const key = normalizeTitle(title);
    const existing = byTitle.get(key);
    byTitle.set(key, existing ? mergeTasks(existing, normalized) : normalized);
  }

  return [...byTitle.values()];
};

/**
 * Consolide le plan révisé à partir du plan précédent :
 *  - une tâche conservée mais renvoyée sans description récupère l'ancienne ;
 *  - les labels de la tâche précédente sont réinjectés si le modèle les a omis ;
 *  - les doublons introduits par le raffinage sont fusionnés.
 *
 * Une tâche absente du plan révisé reste supprimée : c'est le résultat attendu
 * quand l'instruction demandait de la retirer.
 */
const reconcilePlan = (previousPlan, revisedPlan) => {
  const previousByTitle = new Map(
    dedupeTasks(previousPlan?.tasks).map((task) => [normalizeTitle(task.title), task]),
  );

  const tasks = dedupeTasks(revisedPlan?.tasks).map((task) => {
    const previous = previousByTitle.get(normalizeTitle(task.title));
    if (!previous) return task;

    return makeTask({
      title: task.title,
      description: task.description ?? previous.description,
      labels: task.labels?.length ? task.labels : cleanLabels(previous.labels),
    });
  });

  return { ...revisedPlan, tasks };
};

module.exports = { normalizeTitle, dedupeTasks, reconcilePlan };
