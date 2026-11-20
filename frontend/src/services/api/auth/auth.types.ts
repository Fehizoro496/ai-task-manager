import type { AppearancePrefs, NotificationsPrefs, User } from "../users";

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

export interface UpdateMeInput {
  name?: string;
  preferences?: {
    appearance?: Partial<AppearancePrefs>;
    notifications?: Partial<NotificationsPrefs>;
  };
}
