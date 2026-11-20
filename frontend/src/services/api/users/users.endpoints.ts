export const usersEndpoints = {
  root: () => "/api/users",
  byId: (id: string) => `/api/users/${id}`,
} as const;
