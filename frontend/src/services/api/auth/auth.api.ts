import { apiClient } from "../core";
import type { User } from "../users";
import { authEndpoints } from "./auth.endpoints";
import type { GithubAuthUrl, GithubStatus, UpdateMeInput } from "./auth.types";

export const authApi = {
  me: () => apiClient.get<User>(authEndpoints.me()),

  updateMe: (input: UpdateMeInput) =>
    apiClient.patch<User>(authEndpoints.updateMe(), input),

  githubInit: () =>
    apiClient.get<GithubAuthUrl>(authEndpoints.githubInit(), { auth: false }),

  githubStatus: (state: string) =>
    apiClient.get<GithubStatus>(authEndpoints.githubStatus(state), {
      auth: false,
    }),
};
