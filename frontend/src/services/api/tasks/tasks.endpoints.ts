export const tasksEndpoints = {
  root: () => "/api/tasks",
  byId: (id: string) => `/api/tasks/${id}`,
  listByProject: (projectId: string) =>
    `/api/tasks?projectId=${encodeURIComponent(projectId)}`,
  move: (id: string) => `/api/tasks/${id}/move`,
  assign: (id: string) => `/api/tasks/${id}/assign`,
  image: (id: string) => `/api/tasks/${id}/image`,
  search: (q: string, limit = 8) =>
    `/api/tasks/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  /** Tâches assignées à l'utilisateur courant (filtrées et paginées côté serveur). */
  mine: () => "/api/tasks/my",
} as const;
