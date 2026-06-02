import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type {
  AppearancePrefs,
  GithubAuthUrl,
  GithubStatus,
  NotificationsPrefs,
  User,
} from "./types";

export interface UpdateMeInput {
  name?: string;
  preferences?: {
    appearance?: Partial<AppearancePrefs>;
    notifications?: Partial<NotificationsPrefs>;
  };
}

export const authApi = {
  me: () => apiClient.get<User>(endpoints.auth.me()),

  updateMe: (input: UpdateMeInput) =>
    apiClient.patch<User>(endpoints.auth.updateMe(), input),

  githubInit: () =>
    apiClient.get<GithubAuthUrl>(endpoints.auth.githubInit(), { auth: false }),

  githubStatus: (state: string) =>
    apiClient.get<GithubStatus>(endpoints.auth.githubStatus(state), {
      auth: false,
    }),
};
