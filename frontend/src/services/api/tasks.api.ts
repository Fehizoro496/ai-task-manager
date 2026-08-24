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

export type MyTasksScope = "all" | "active" | "done";
export type MyTasksSort = "due_asc" | "due_desc" | "priority" | "recent";

/**
 * Filtres de la page « Mes tâches ». Tout est appliqué côté serveur : la
 * réponse est déjà filtrée, triée et découpée en pages.
 */
export interface MyTasksQuery {
  scope?: MyTasksScope;
  q?: string;
  /** Priorités retenues — sérialisées en CSV. */
  priorities?: TaskPriority[];
  /** Projets retenus — sérialisés en CSV. */
  projectIds?: string[];
  sort?: MyTasksSort;
  limit?: number;
  offset?: number;
}

export interface MyTasksPage {
  tasks: Task[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export const tasksApi = {
  listByProject: (projectId: string) =>
    apiClient.get<Task[]>(endpoints.tasks.listByProject(projectId)),

  getById: (id: string) => apiClient.get<Task>(endpoints.tasks.byId(id)),

  /** Page de tâches assignées à l'utilisateur courant. */
  listMine: ({ priorities, projectIds, q, ...rest }: MyTasksQuery, signal?: AbortSignal) =>
    apiClient.get<MyTasksPage>(endpoints.tasks.mine(), {
      signal,
      query: {
        ...rest,
        q: q?.trim() || undefined,
        priority: priorities?.length ? priorities.join(",") : undefined,
        projectId: projectIds?.length ? projectIds.join(",") : undefined,
      },
    }),

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

  /** Attache (ou remplace) l'image de la tâche via multipart. */
  uploadImage: (id: string, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return apiClient.post<Task>(endpoints.tasks.image(id), form);
  },

  /** Retire l'image de la tâche. */
  removeImage: (id: string) =>
    apiClient.delete<Task>(endpoints.tasks.image(id)),

  remove: (id: string) => apiClient.delete<void>(endpoints.tasks.byId(id)),
};
