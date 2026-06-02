import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { ProjectMember, User, UserStatus } from "./types";

export const adminApi = {
  listUsers: (status?: UserStatus) =>
    apiClient.get<{ users: User[] }>(endpoints.admin.listUsers(status)),

  approveUser: (id: string) =>
    apiClient.patch<{ user: User }>(endpoints.admin.approveUser(id)),

  rejectUser: (id: string) =>
    apiClient.patch<{ user: User }>(endpoints.admin.rejectUser(id)),

  listProjectMembers: (projectId: string) =>
    apiClient.get<{ members: ProjectMember[] }>(
      endpoints.admin.projectMembers(projectId),
    ),

  addProjectMember: (projectId: string, userId: string) =>
    apiClient.post<{ member: ProjectMember }>(
      endpoints.admin.projectMembers(projectId),
      { userId },
    ),

  removeProjectMember: (projectId: string, userId: string) =>
    apiClient.delete<void>(endpoints.admin.projectMember(projectId, userId)),
};
