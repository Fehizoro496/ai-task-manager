import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { Project, Task } from "./types";

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

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
};
