export const projectsEndpoints = {
  root: () => "/api/projects",
  byId: (id: string) => `/api/projects/${id}`,
  tasks: (projectId: string) => `/api/projects/${projectId}/tasks`,
  members: (projectId: string) => `/api/projects/${projectId}/members`,
  reorderTasks: (projectId: string) =>
    `/api/projects/${projectId}/tasks/reorder`,
} as const;
