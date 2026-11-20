import type { UUID } from "../core";
import type { TaskPriority, TaskStatus } from "../tasks";
import type { User } from "../users";

export interface Conversation {
  id: UUID;
  name: string | null;
  isGroup: boolean;
  members: Pick<User, "id" | "name" | "avatar_url">[];
  unreadCount: number;
  lastMessage: {
    content: string;
    senderId: UUID;
    senderName: string;
    createdAt: string;
  } | null;
}

/** Tâche citée via une mention `#AM-001` dans un message. */
export interface MentionedTask {
  id: UUID;
  identifier: string;
  title: string;
  status: TaskStatus | Uppercase<TaskStatus>;
  priority: TaskPriority;
  projectId: UUID | null;
  projectName: string | null;
  assignee: {
    id: UUID;
    name: string;
    avatar_url: string | null;
  } | null;
}

/** Pièce jointe d'un message. `url` est relative à l'hôte backend (/uploads/...). */
export interface Attachment {
  url: string;
  name: string;
  mime: string;
  size: number;
}

export interface Message {
  id: UUID;
  conversationId: UUID;
  content: string;
  senderId: UUID;
  senderName: string;
  sender_avatar_url: string | null;
  attachments?: Attachment[];
  /** Renseigné si le message a été supprimé (tombstone). */
  deletedAt?: string | null;
  /** Tâches mentionnées résolues pour le lecteur : celles hors de sa portée en sont absentes. */
  mentionedTasks?: MentionedTask[];
  createdAt: string;
}
