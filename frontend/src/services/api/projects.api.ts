import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { Project, ProjectMember, Task, TaskStatus } from "./types";

export type ReorderColumns = Partial<Record<TaskStatus, string[]>>;

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  githubRepoUrl?: string;
  identifierPrefix?: string;
  /** Crée un dépôt GitHub pour le projet (ignoré si githubRepoUrl est fourni). */
  createGithubRepo?: boolean;
}

/**
 * Réponse de création : `githubRepoWarning` est présent quand le dépôt
 * demandé n'a pas pu être créé — le projet, lui, existe bien.
 */
export type CreatedProject = Project & { githubRepoWarning?: string };

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
  priority?: string;
  status?: string;
}

export const projectsApi = {
  list: () => apiClient.get<Project[]>(endpoints.projects.root()),

  getById: (id: string) =>
    apiClient.get<Project>(endpoints.projects.byId(id)),

  create: (input: CreateProjectInput) =>
    apiClient.post<CreatedProject>(endpoints.projects.root(), input),

  update: (id: string, input: UpdateProjectInput) =>
    apiClient.put<Project>(endpoints.projects.byId(id), input),

  remove: (id: string) =>
    apiClient.delete<void>(endpoints.projects.byId(id)),

  listTasks: (projectId: string) =>
    apiClient.get<{ tasks: Task[] }>(endpoints.projects.tasks(projectId)),

  listMembers: (projectId: string) =>
    apiClient.get<{ members: ProjectMember[] }>(
      endpoints.projects.members(projectId),
    ),

  createTask: (projectId: string, input: CreateProjectTaskInput) =>
    apiClient.post<Task>(endpoints.projects.tasks(projectId), input),

  reorderTasks: (projectId: string, columns: ReorderColumns) =>
    apiClient.patch<{ updated: number }>(
      endpoints.projects.reorderTasks(projectId),
      { columns },
    ),
};
