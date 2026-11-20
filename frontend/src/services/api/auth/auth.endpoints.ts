export const authEndpoints = {
  me: () => "/api/auth/me",
  updateMe: () => "/api/auth/me",
  githubInit: () => "/api/auth/github",
  githubCallback: () => "/api/auth/github/callback",
  githubStatus: (state: string) => `/api/auth/github/status/${state}`,
} as const;
