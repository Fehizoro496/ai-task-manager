export type UUID = string;

export type UserRole = "ADMIN" | "MEMBER";
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AppearanceTheme = "clair" | "sombre" | "systeme";
export type Density = "compact" | "standard" | "confort";

export interface AppearancePrefs {
  theme: AppearanceTheme;
  accent: string;
  density: Density;
}

export interface NotificationsPrefs {
  dailyDigest: boolean;
  push: boolean;
  weekendQuiet: boolean;
  sounds: boolean;
}

export interface UserPreferences {
  appearance: AppearancePrefs;
  notifications: NotificationsPrefs;
}

export interface User {
  id: UUID;
  email: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  provider?: string;
  preferences?: UserPreferences;
  createdAt?: string;
}

export interface AuthSuccess {
  token: string;
  user: User;
}

export interface GithubAuthUrl {
  url: string;
  state: string;
}

export type GithubStatus =
  | { status: "pending" }
  | { status: "pending_approval"; user: User; token: string | null }
  | { status: "success"; token: string; user: User }
  | { status: "error"; error: string }
  | { status: "expired" };

export interface Project {
  id: UUID;
  name: string;
  description: string | null;
  color?: string | null;
  createdAt: string;
  ownerId?: UUID;
  identifierPrefix?: string | null;
  githubRepoUrl?: string | null;
  githubOwner?: string | null;
  githubRepo?: string | null;
}

export interface Epic {
  id: UUID;
  title: string;
  description: string | null;
  projectId: UUID;
  position: number;
}

export interface Story {
  id: UUID;
  title: string;
  description: string | null;
  epicId: UUID;
  position: number;
}

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: UUID;
  identifier?: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority | null;
  position: number;
  storyId: UUID | null;
  projectId?: UUID;
  assigneeId: UUID | null;
  assignee?: {
    id: UUID;
    name: string;
    avatar_url: string | null;
  } | null;
  labels: string[];
  commentsCount?: number;
  dueDate: string | null;
  branch?: string | null;
  githubBranch?: string | null;
  githubBranchUrl?: string | null;
}

export interface AiDraft {
  id: UUID;
  projectId: UUID;
  project_id?: UUID;
  document?: string;
  input_document?: string;
  /** Plan généré (structure { epics: [...] }). `generated_plan` en est l'alias. */
  plan?: unknown;
  generated_plan?: unknown;
  approved?: boolean;
  status?: "pending" | "generated" | "approved";
  /** Fil de discussion de raffinement (persisté). */
  messages?: AiDraftMessage[];
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface AiDraftMessage {
  id: UUID;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ProjectMember {
  id: UUID;
  userId: UUID;
  projectId: UUID;
  user?: User;
}

export interface Notification {
  id: UUID;
  type: string;
  title?: string | null;
  message: string;
  link?: string | null;
  taskId?: string | null;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

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

export interface Message {
  id: UUID;
  conversationId: UUID;
  content: string;
  senderId: UUID;
  senderName: string;
  sender_avatar_url: string | null;
  createdAt: string;
}
