export const commentsEndpoints = {
  listForTask: (taskId: string) => `/api/tasks/${taskId}/comments`,
  createForTask: (taskId: string) => `/api/tasks/${taskId}/comments`,
  byId: (id: string) => `/api/comments/${id}`,
} as const;
