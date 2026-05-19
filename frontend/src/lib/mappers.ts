import type { Priority as FrPriority, Status as FrStatus } from "./types";
import type { TaskPriority, TaskStatus } from "@/services";

export const statusApiToFr: Record<TaskStatus, FrStatus> = {
  todo: "a_faire",
  in_progress: "en_cours",
  in_review: "en_revue",
  done: "termine",
};

export const statusFrToApi: Record<FrStatus, TaskStatus> = {
  a_faire: "todo",
  en_cours: "in_progress",
  en_revue: "in_review",
  termine: "done",
};

export const priorityApiToFr: Record<TaskPriority, FrPriority> = {
  urgent: "urgent",
  high: "elevee",
  medium: "moyenne",
  low: "faible",
};

export const priorityFrToApi: Record<FrPriority, TaskPriority> = {
  urgent: "urgent",
  elevee: "high",
  moyenne: "medium",
  faible: "low",
};

export function normalizeApiStatus(s: string | null | undefined): FrStatus {
  if (!s) return "a_faire";
  const lower = s.toLowerCase() as TaskStatus;
  return statusApiToFr[lower] ?? "a_faire";
}

export function normalizeApiPriority(p: string | null | undefined): FrPriority {
  if (!p) return "moyenne";
  const lower = p.toLowerCase() as TaskPriority;
  return priorityApiToFr[lower] ?? "moyenne";
}

const PROJECT_COLORS = [
  "#6366F1",
  "#14B8A6",
  "#F59E0B",
  "#EC4899",
  "#10B981",
  "#0EA5E9",
  "#A855F7",
  "#FB7185",
];

export function colorForProject(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return PROJECT_COLORS[n % PROJECT_COLORS.length];
}

export function prefixForProject(name: string): string {
  return (
    name
      .replace(/[^A-Za-z]/g, "")
      .slice(0, 2)
      .toUpperCase() || "PR"
  );
}

/**
 * Renvoie le préfixe d'identifiant à utiliser pour un projet. Privilégie
 * la valeur stockée en base (modifiable depuis les paramètres) et tombe
 * sur une dérivation du nom uniquement si elle est absente.
 */
export function projectPrefix(
  project: { identifierPrefix?: string | null; name: string } | null | undefined,
): string {
  if (!project) return "PR";
  const stored = project.identifierPrefix?.trim();
  if (stored) return stored.toUpperCase();
  return prefixForProject(project.name);
}

export function taskCode(prefix: string, idOrPosition: string | number): string {
  const n =
    typeof idOrPosition === "number"
      ? idOrPosition
      : Math.abs(
          [...String(idOrPosition)].reduce(
            (acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0,
            0,
          ),
        ) % 999;
  return `${prefix}-${String(n).padStart(3, "0")}`;
}
