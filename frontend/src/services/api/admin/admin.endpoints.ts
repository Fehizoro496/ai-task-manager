export const adminEndpoints = {
  users: () => "/api/admin/users",
  listUsers: (status?: string) =>
    status
      ? `/api/admin/users?status=${encodeURIComponent(status)}`
      : "/api/admin/users",
  approveUser: (id: string) => `/api/admin/users/${id}/approve`,
  rejectUser: (id: string) => `/api/admin/users/${id}/reject`,
  projectMembers: (projectId: string) =>
    `/api/admin/projects/${projectId}/members`,
  projectMember: (projectId: string, userId: string) =>
    `/api/admin/projects/${projectId}/members/${userId}`,
} as const;
