import type { User } from "./types";

export type ChannelKind = "project" | "team" | "dm";

export interface Channel {
  id: string;
  kind: ChannelKind;
  name: string;
  topic?: string;
  members: number;
  unread?: number;
  pinned?: boolean;
  projectId?: string; // when kind=project
  dmUserId?: string;  // when kind=dm
  lastSnippet?: string;
  lastAt?: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  by: string[]; // user ids
}

export interface ChatMessage {
  id: string;
  channelId: string;
  authorId: string;
  body: string;
  createdAt: string; // ISO
  attachments?: {
    kind: "task" | "image" | "file" | "link";
    title: string;
    meta?: string;
    href?: string;
  }[];
  reactions?: Reaction[];
  replies?: number;
  parentId?: string;
}

export interface TypingState {
  channelId: string;
  userIds: string[];
}

export const channels: Channel[] = [
  {
    id: "ch_atm",
    kind: "project",
    name: "ai-task-manager",
    topic: "Coordination du produit core. PR, design, IA.",
    members: 4,
    unread: 5,
    projectId: "p_atm",
    pinned: true,
    lastSnippet: "Sarah : on garde la pagination cursor-based ?",
    lastAt: "2024-05-15T09:38:00",
  },
  {
    id: "ch_web",
    kind: "project",
    name: "website-redesign",
    topic: "Refonte du corporate. Sprint 3.",
    members: 3,
    unread: 0,
    projectId: "p_web",
    lastSnippet: "Julie : la palette finale est dans le Figma",
    lastAt: "2024-05-14T17:22:00",
  },
  {
    id: "ch_mob",
    kind: "project",
    name: "mobile-app",
    topic: "iOS & Android MVP — release juin.",
    members: 3,
    unread: 2,
    projectId: "p_mob",
    lastSnippet: "Thomas : tests sur Pixel 7 ok",
    lastAt: "2024-05-15T08:12:00",
  },
  {
    id: "ch_api",
    kind: "project",
    name: "api-gateway",
    topic: "Infra & contrats publics.",
    members: 3,
    unread: 0,
    projectId: "p_api",
    lastSnippet: "Paul : doc OpenAPI à jour",
    lastAt: "2024-05-13T16:01:00",
  },
  {
    id: "ch_team",
    kind: "team",
    name: "studio-général",
    topic: "Le canal général. RH, événements, gifs autorisés.",
    members: 5,
    unread: 0,
    lastSnippet: "Alex : rétro demain 16h, n'oubliez pas",
    lastAt: "2024-05-14T11:30:00",
  },
  {
    id: "ch_rand",
    kind: "team",
    name: "random",
    topic: "Hors-sujet, mèmes, recos.",
    members: 5,
    unread: 0,
    lastSnippet: "Julie : 📷 → studio_window.jpg",
    lastAt: "2024-05-13T19:48:00",
  },
  // DMs
  {
    id: "dm_sarah",
    kind: "dm",
    name: "Sarah Dupont",
    members: 2,
    unread: 1,
    dmUserId: "u_sarah",
    lastSnippet: "Tu peux jeter un œil sur la PR avant 18h ?",
    lastAt: "2024-05-15T09:14:00",
  },
  {
    id: "dm_thomas",
    kind: "dm",
    name: "Thomas Bernard",
    members: 2,
    unread: 0,
    dmUserId: "u_thomas",
    lastSnippet: "OK je relance le runner CI",
    lastAt: "2024-05-15T08:02:00",
  },
  {
    id: "dm_julie",
    kind: "dm",
    name: "Julie Martin",
    members: 2,
    unread: 0,
    dmUserId: "u_julie",
    lastSnippet: "Merci, je regarde ✨",
    lastAt: "2024-05-13T17:55:00",
  },
];

export const messages: ChatMessage[] = [
  {
    id: "m_001",
    channelId: "ch_atm",
    authorId: "u_thomas",
    body:
      "Bonjour à tous 👋 — petit point sur le sprint : on est à **62 / 96 points livrés**, donc 8 pts de dette à rattraper. Je propose de paralléliser la revue AM-107 pour débloquer Sarah.",
    createdAt: "2024-05-15T08:40:00",
    reactions: [
      { emoji: "👍", count: 2, by: ["u_alex", "u_julie"] },
      { emoji: "🔥", count: 1, by: ["u_sarah"] },
    ],
    replies: 3,
  },
  {
    id: "m_002",
    channelId: "ch_atm",
    authorId: "u_sarah",
    body:
      "Je viens de pousser **3 commits** sur `feat/am-105-api-projects`. La pagination cursor-based est en place côté serveur. Question pour l'équipe : on garde le format `cursor=<opaque>` ou on passe à `after_id` ?",
    createdAt: "2024-05-15T09:12:00",
    attachments: [
      {
        kind: "task",
        title: "API pour la gestion des projets",
        meta: "AM-105 · Urgent · Échéance demain",
        href: "/tasks/t_105",
      },
    ],
    reactions: [{ emoji: "🚀", count: 3, by: ["u_alex", "u_julie", "u_thomas"] }],
  },
  {
    id: "m_003",
    channelId: "ch_atm",
    authorId: "u_alex",
    body:
      "Côté cursor je trouve `cursor=<opaque>` plus propre pour évoluer (filtres custom). Le client n'a pas besoin de connaître la sémantique. Tu en penses quoi @sarah ?",
    createdAt: "2024-05-15T09:24:00",
  },
  {
    id: "m_004",
    channelId: "ch_atm",
    authorId: "u_sarah",
    body:
      "Validé pour `cursor=<opaque>`. Je documente dans la PR.",
    createdAt: "2024-05-15T09:38:00",
    reactions: [{ emoji: "✅", count: 2, by: ["u_alex", "u_thomas"] }],
  },
  {
    id: "m_005",
    channelId: "ch_atm",
    authorId: "u_julie",
    body:
      "Petite démo des composants Kanban en pièce jointe — drag&drop fluide, j'ai ajouté un overlay sur le drag. Reviews bienvenues 🙏",
    createdAt: "2024-05-15T09:45:00",
    attachments: [
      {
        kind: "image",
        title: "kanban-drag-demo.gif",
        meta: "2,4 Mo · capture du Board",
      },
    ],
  },
];
