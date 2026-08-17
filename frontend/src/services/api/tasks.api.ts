import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { Task, TaskPriority, TaskStatus } from "./types";

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId?: string;
  priority?: TaskPriority;
  position?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus | Uppercase<TaskStatus>;
  position?: number;
  priority?: TaskPriority;
  assigneeId?: string | null;
  labels?: string[];
  dueDate?: string | null;
}

export interface MoveTaskInput {
  status: TaskStatus;
  order?: number;
}

export const tasksApi = {
  listByProject: (projectId: string) =>
    apiClient.get<Task[]>(endpoints.tasks.listByProject(projectId)),

  getById: (id: string) => apiClient.get<Task>(endpoints.tasks.byId(id)),

  /** Recherche par identifiant ou titre, restreinte aux tâches visibles. */
  search: (q: string, limit = 8) =>
    apiClient.get<{ tasks: Task[] }>(endpoints.tasks.search(q, limit)),

  create: (input: CreateTaskInput) =>
    apiClient.post<Task>(endpoints.tasks.root(), input),

  update: (id: string, input: UpdateTaskInput) =>
    apiClient.put<Task>(endpoints.tasks.byId(id), input),

  move: (id: string, input: MoveTaskInput) =>
    apiClient.patch<Task>(endpoints.tasks.move(id), input),

  assign: (id: string) =>
    apiClient.patch<Task>(endpoints.tasks.assign(id)),

  remove: (id: string) => apiClient.delete<void>(endpoints.tasks.byId(id)),
};
