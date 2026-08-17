const { findVisibleByIdentifiers } = require('../tasks/tasks.service');

// Un identifiant de tâche suit le format `<PREFIX>-<NNN>` (cf.
// generateTaskIdentifier). Doit rester synchronisé avec la règle du client
// (`frontend/src/lib/task-mentions.ts`), sans quoi une mention résolue ici
// pourrait ne pas être rendue là-bas.
const MENTION_PATTERN = /#([A-Za-z][A-Za-z0-9]*-\d+)(?![\w-])/g;

// Garde-fou : un message ne peut pas faire exploser la requête de résolution.
const MAX_MENTIONS_PER_LOOKUP = 20;

// Évite de capturer une mention collée à un mot (`abc#AM-001`) ou à un
// identifiant déjà consommé.
const isMentionBoundary = (char) => char === undefined || !/[\w-]/.test(char);

/**
 * Extrait les identifiants de tâches mentionnés (`#AM-001`) d'un contenu.
 * Les doublons sont dédupliqués sans tenir compte de la casse.
 */
const extractIdentifiers = (content) => {
  if (!content) return [];
  const seen = new Map();
  for (const match of content.matchAll(MENTION_PATTERN)) {
    if (!isMentionBoundary(content[match.index - 1])) continue;
    const identifier = match[1];
    const key = identifier.toUpperCase();
    if (!seen.has(key)) seen.set(key, identifier);
  }
  return [...seen.values()];
};

const serializeMentionedTask = (task) => ({
  id: task.id,
  identifier: task.identifier,
  title: task.title,
  status: task.status,
  priority: task.priority || 'medium',
  projectId: task.projectId,
  projectName: task.project?.name ?? null,
  assignee: task.assignee
    ? {
        id: task.assignee.id,
        name: task.assignee.name,
        avatar_url: task.assignee.avatarUrl || null,
      }
    : null,
});

/**
 * Résout les mentions d'un lot de messages pour un lecteur donné, en une seule
 * requête. Les tâches hors de sa portée sont simplement absentes du résultat :
 * le client les rendra en texte brut.
 */
const resolveMentionsForMessages = async (messages, userId, isAdmin) => {
  const identifiers = [
    ...new Set(
      messages.flatMap((m) => extractIdentifiers(m.content).map((i) => i.toUpperCase())),
    ),
  ].slice(0, MAX_MENTIONS_PER_LOOKUP);

  if (identifiers.length === 0) return new Map();

  const tasks = await findVisibleByIdentifiers(identifiers, userId, isAdmin);
  return new Map(tasks.map((t) => [t.identifier.toUpperCase(), serializeMentionedTask(t)]));
};

/**
 * Sélectionne, dans la table résolue, les tâches effectivement citées par un
 * message.
 */
const pickMentionsFor = (content, resolved) =>
  extractIdentifiers(content)
    .map((identifier) => resolved.get(identifier.toUpperCase()))
    .filter(Boolean);

module.exports = {
  extractIdentifiers,
  resolveMentionsForMessages,
  pickMentionsFor,
};
