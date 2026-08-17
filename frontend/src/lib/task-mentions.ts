import type { MentionedTask } from "@/services";

/**
 * Une mention cite une tâche par son identifiant : `#AM-001`. Le format suit
 * celui généré côté serveur (`<PREFIX>-<NNN>`).
 *
 * Volontairement sans lookbehind (`(?<!…)`) pour rester compatible avec les
 * moteurs JS anciens — la frontière gauche est vérifiée via `isMentionBoundary`.
 */
export const TASK_MENTION_PATTERN = /#([A-Za-z][A-Za-z0-9]*-\d+)(?![\w-])/g;

/**
 * Vrai si `char` peut précéder un `#` de mention : on évite ainsi de capturer
 * une mention collée à un mot (`abc#AM-001`) ou à un identifiant déjà consommé.
 */
export function isMentionBoundary(char: string | undefined): boolean {
  return char === undefined || !/[\w-]/.test(char);
}

export type MentionSegment =
  | { kind: "text"; value: string }
  | { kind: "mention"; raw: string; identifier: string; task: MentionedTask | null };

/**
 * Découpe un contenu de message en segments texte / mention. Une mention dont
 * la tâche n'a pas été résolue (supprimée, ou hors de portée du lecteur) porte
 * `task: null` et doit être rendue en texte brut.
 */
export function parseTaskMentions(
  content: string,
  mentionedTasks: MentionedTask[] = [],
): MentionSegment[] {
  const byIdentifier = new Map(
    mentionedTasks.map((t) => [t.identifier.toUpperCase(), t]),
  );

  const segments: MentionSegment[] = [];
  let cursor = 0;

  for (const match of content.matchAll(TASK_MENTION_PATTERN)) {
    const start = match.index ?? 0;
    if (!isMentionBoundary(content[start - 1])) continue;

    if (start > cursor) {
      segments.push({ kind: "text", value: content.slice(cursor, start) });
    }
    segments.push({
      kind: "mention",
      raw: match[0],
      identifier: match[1],
      task: byIdentifier.get(match[1].toUpperCase()) ?? null,
    });
    cursor = start + match[0].length;
  }

  if (cursor < content.length) {
    segments.push({ kind: "text", value: content.slice(cursor) });
  }
  return segments;
}
