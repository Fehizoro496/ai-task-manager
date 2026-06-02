import type { Priority, Status } from "./types";

export const statusLabel: Record<Status, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  en_revue: "En revue",
  termine: "Terminé",
};

export const priorityLabel: Record<Priority, string> = {
  urgent: "Urgent",
  elevee: "Élevée",
  moyenne: "Moyenne",
  faible: "Faible",
};

export const statusToken: Record<Status, { bg: string; fg: string; dot: string }> = {
  a_faire:  { bg: "bg-[hsl(var(--status-todo-bg))]",   fg: "text-[hsl(var(--status-todo-fg))]",   dot: "bg-[hsl(var(--ink-3))]" },
  en_cours: { bg: "bg-[hsl(var(--status-doing-bg))]",  fg: "text-[hsl(var(--status-doing-fg))]",  dot: "bg-[hsl(var(--accent-amber))]" },
  en_revue: { bg: "bg-[hsl(var(--status-review-bg))]", fg: "text-[hsl(var(--status-review-fg))]", dot: "bg-[hsl(var(--brand))]" },
  termine:  { bg: "bg-[hsl(var(--status-done-bg))]",   fg: "text-[hsl(var(--status-done-fg))]",   dot: "bg-[hsl(var(--accent-sage))]" },
};

export const priorityToken: Record<Priority, { bg: string; fg: string }> = {
  urgent:  { bg: "bg-[hsl(var(--prio-urgent-bg))]", fg: "text-[hsl(var(--prio-urgent-fg))]" },
  elevee:  { bg: "bg-[hsl(var(--prio-high-bg))]",   fg: "text-[hsl(var(--prio-high-fg))]"   },
  moyenne: { bg: "bg-[hsl(var(--prio-med-bg))]",    fg: "text-[hsl(var(--prio-med-fg))]"    },
  faible:  { bg: "bg-[hsl(var(--prio-low-bg))]",    fg: "text-[hsl(var(--prio-low-fg))]"    },
};
