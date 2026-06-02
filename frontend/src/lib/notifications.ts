export type NotifKind =
  | "mention"
  | "assignment"
  | "deadline"
  | "comment"
  | "review"
  | "push"
  | "ai";

export interface Notif {
  id: string;
  kind: NotifKind;
  actor?: { id: string; name: string };
  title: string;
  body?: string;
  taskCode?: string;
  href?: string;
  createdAt: string; // ISO
  group: "today" | "earlier";
  unread: boolean;
}

export const notifications: Notif[] = [
  {
    id: "n_1",
    kind: "mention",
    actor: { id: "u_sarah", name: "Sarah Dupont" },
    title: "vous a mentionné sur",
    body: "« Peux-tu valider la pagination cursor-based avant fin de journée ? »",
    taskCode: "AM-105",
    href: "/tasks/t_105",
    createdAt: "2024-05-15T09:32:00",
    group: "today",
    unread: true,
  },
  {
    id: "n_2",
    kind: "review",
    actor: { id: "u_thomas", name: "Thomas Bernard" },
    title: "a demandé votre revue",
    body: "PR #128 — Module d'authentification OAuth",
    taskCode: "AM-107",
    href: "/tasks/t_107",
    createdAt: "2024-05-15T09:12:00",
    group: "today",
    unread: true,
  },
  {
    id: "n_3",
    kind: "deadline",
    title: "Échéance proche",
    body: "API pour la gestion des projets — dans 2 heures",
    taskCode: "AM-105",
    href: "/tasks/t_105",
    createdAt: "2024-05-15T08:45:00",
    group: "today",
    unread: true,
  },
  {
    id: "n_4",
    kind: "ai",
    title: "Plan IA prêt",
    body: "Votre plan « Application mobile » contient 2 epics et 16 tâches.",
    href: "/ai/new",
    createdAt: "2024-05-15T08:10:00",
    group: "today",
    unread: false,
  },
  {
    id: "n_5",
    kind: "comment",
    actor: { id: "u_julie", name: "Julie Martin" },
    title: "a commenté",
    body: "« Joli travail sur les composants, je continue côté tokens. »",
    taskCode: "AM-097",
    href: "/tasks/t_097",
    createdAt: "2024-05-14T17:20:00",
    group: "earlier",
    unread: false,
  },
  {
    id: "n_6",
    kind: "assignment",
    actor: { id: "u_alex", name: "Alex Martin" },
    title: "vous a assigné une tâche",
    body: "Configurer les notifications in-app",
    taskCode: "AM-103",
    href: "/tasks/t_103",
    createdAt: "2024-05-14T15:48:00",
    group: "earlier",
    unread: false,
  },
  {
    id: "n_7",
    kind: "push",
    actor: { id: "u_sarah", name: "Sarah Dupont" },
    title: "a poussé sur",
    body: "feat/am-105-api-projects · 3 commits",
    href: "/projects/p_atm/board",
    createdAt: "2024-05-14T11:02:00",
    group: "earlier",
    unread: false,
  },
];
