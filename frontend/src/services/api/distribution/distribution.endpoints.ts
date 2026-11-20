export const distributionEndpoints = {
  suggestAssignee: (taskId: string) =>
    `/api/tasks/${taskId}/suggest-assignee`,
  distribute: (projectId: string) => `/api/projects/${projectId}/distribute`,
  applyDistribution: (projectId: string) =>
    `/api/projects/${projectId}/distribute/apply`,
} as const;
