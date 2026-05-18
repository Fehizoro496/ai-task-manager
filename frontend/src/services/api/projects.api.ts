import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { Project, Task, TaskStatus } from "./types";

export type ReorderColumns = Partial<Record<TaskStatus, string[]>>;

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  githubRepoUrl?: string;
  identifierPrefix?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
  githubRepoUrl?: string | null;
  identifierPrefix?: string;
}

export interface CreateProjectTaskInput {
  title: string;
  description?: string;
  storyId?: string;
}

export const projectsApi = {
  list: () => apiClient.get<Project[]>(endpoints.projects.root()),

  getById: (id: string) =>
    apiClient.get<Project>(endpoints.projects.byId(id)),

  create: (input: CreateProjectInput) =>
    apiClient.post<Project>(endpoints.projects.root(), input),

  update: (id: string, input: UpdateProjectInput) =>
    apiClient.put<Project>(endpoints.projects.byId(id), input),

  remove: (id: string) =>
    apiClient.delete<void>(endpoints.projects.byId(id)),

  listTasks: (projectId: string) =>
    apiClient.get<{ tasks: Task[] }>(endpoints.projects.tasks(projectId)),

  createTask: (projectId: string, input: CreateProjectTaskInput) =>
    apiClient.post<Task>(endpoints.projects.tasks(projectId), input),

  reorderTasks: (projectId: string, columns: ReorderColumns) =>
    apiClient.patch<{ updated: number }>(
      endpoints.projects.reorderTasks(projectId),
      { columns },
    ),
};
