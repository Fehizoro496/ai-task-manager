import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { GithubAuthUrl, GithubStatus, User } from "./types";

export const authApi = {
  me: () => apiClient.get<User>(endpoints.auth.me()),

  githubInit: () =>
    apiClient.get<GithubAuthUrl>(endpoints.auth.githubInit(), { auth: false }),

  githubStatus: (state: string) =>
    apiClient.get<GithubStatus>(endpoints.auth.githubStatus(state), {
      auth: false,
    }),
};
