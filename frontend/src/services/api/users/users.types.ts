import type { UUID } from "../core";

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
  githubLogin?: string | null;
  /** Vrai si un token GitHub est enregistré côté serveur (jamais exposé). */
  githubConnected?: boolean;
  preferences?: UserPreferences;
  createdAt?: string;
}

export interface UserRecentTask {
  id: UUID;
  identifier: string | null;
  title: string;
  status: string;
  priority: string;
  projectId: UUID | null;
  projectName: string | null;
  dueDate: string | null;
  updatedAt: string;
}

export interface UserDetail extends User {
  stats: {
    tasksAssigned: number;
    projectsCount: number;
  };
  recentTasks: UserRecentTask[];
}
