import { apiClient } from "../core";
import type { ProjectMember } from "../projects";
import type { User, UserStatus } from "../users";
import { adminEndpoints } from "./admin.endpoints";

export const adminApi = {
  listUsers: (status?: UserStatus) =>
    apiClient.get<{ users: User[] }>(adminEndpoints.listUsers(status)),

  approveUser: (id: string) =>
    apiClient.patch<{ user: User }>(adminEndpoints.approveUser(id)),

  rejectUser: (id: string) =>
    apiClient.patch<{ user: User }>(adminEndpoints.rejectUser(id)),

  listProjectMembers: (projectId: string) =>
    apiClient.get<{ members: ProjectMember[] }>(
      adminEndpoints.projectMembers(projectId),
    ),

  addProjectMember: (projectId: string, userId: string) =>
    apiClient.post<{ member: ProjectMember }>(
      adminEndpoints.projectMembers(projectId),
      { userId },
    ),

  removeProjectMember: (projectId: string, userId: string) =>
    apiClient.delete<void>(adminEndpoints.projectMember(projectId, userId)),
};
