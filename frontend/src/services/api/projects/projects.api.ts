import { apiClient } from "../core";
import type { Task } from "../tasks";
import { projectsEndpoints } from "./projects.endpoints";
import type {
  CreatedProject,
  CreateProjectInput,
  CreateProjectTaskInput,
  Project,
  ProjectMember,
  ReorderColumns,
  UpdateProjectInput,
} from "./projects.types";

export const projectsApi = {
  list: () => apiClient.get<Project[]>(projectsEndpoints.root()),

  getById: (id: string) =>
    apiClient.get<Project>(projectsEndpoints.byId(id)),

  create: (input: CreateProjectInput) =>
    apiClient.post<CreatedProject>(projectsEndpoints.root(), input),

  update: (id: string, input: UpdateProjectInput) =>
    apiClient.put<Project>(projectsEndpoints.byId(id), input),

  remove: (id: string) =>
    apiClient.delete<void>(projectsEndpoints.byId(id)),

  listTasks: (projectId: string) =>
    apiClient.get<{ tasks: Task[] }>(projectsEndpoints.tasks(projectId)),

  listMembers: (projectId: string) =>
    apiClient.get<{ members: ProjectMember[] }>(
      projectsEndpoints.members(projectId),
    ),

  createTask: (projectId: string, input: CreateProjectTaskInput) =>
    apiClient.post<Task>(projectsEndpoints.tasks(projectId), input),

  reorderTasks: (projectId: string, columns: ReorderColumns) =>
    apiClient.patch<{ updated: number }>(
      projectsEndpoints.reorderTasks(projectId),
      { columns },
    ),
};
