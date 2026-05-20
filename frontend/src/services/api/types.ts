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
  labels: string[];
  dueDate: string | null;
  branch?: string | null;
  githubBranch?: string | null;
  githubBranchUrl?: string | null;
}

export interface AiDraft {
  id: UUID;
  projectId: UUID;
  status: "PENDING" | "APPROVED" | "REJECTED";
  payload: unknown;
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
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface Conversation {
  id: UUID;
  name: string | null;
  isGroup: boolean;
  members: Pick<User, "id" | "name" | "avatar_url">[];
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
