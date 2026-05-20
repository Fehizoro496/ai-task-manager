import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { User, UUID } from "./types";

export interface UserRecentTask {
  id: UUID;
  identifier: string | null;
  title: string;
  status: string;
  priority: string;
  projectId: UUID | null;
  projectName: string | null;
  dueDate: string | null;
  updatedAt: string;
}

export interface UserDetail extends User {
  stats: {
    tasksAssigned: number;
    projectsCount: number;
  };
  recentTasks: UserRecentTask[];
}

export const usersApi = {
  list: () =>
    apiClient.get<{ users: User[] }>(endpoints.users.root()),

  getById: (id: string) =>
    apiClient.get<UserDetail>(endpoints.users.byId(id)),
};
