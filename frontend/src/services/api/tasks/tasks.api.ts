import { apiClient } from "../core";
import { tasksEndpoints } from "./tasks.endpoints";
import type {
  CreateTaskInput,
  MoveTaskInput,
  MyTasksPage,
  MyTasksQuery,
  Task,
  UpdateTaskInput,
} from "./tasks.types";

export const tasksApi = {
  listByProject: (projectId: string) =>
    apiClient.get<Task[]>(tasksEndpoints.listByProject(projectId)),

  getById: (id: string) => apiClient.get<Task>(tasksEndpoints.byId(id)),

  /** Page de tâches assignées à l'utilisateur courant. */
  listMine: ({ priorities, projectIds, q, ...rest }: MyTasksQuery, signal?: AbortSignal) =>
    apiClient.get<MyTasksPage>(tasksEndpoints.mine(), {
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
    apiClient.get<{ tasks: Task[] }>(tasksEndpoints.search(q, limit)),

  create: (input: CreateTaskInput) =>
    apiClient.post<Task>(tasksEndpoints.root(), input),

  update: (id: string, input: UpdateTaskInput) =>
    apiClient.put<Task>(tasksEndpoints.byId(id), input),

  move: (id: string, input: MoveTaskInput) =>
    apiClient.patch<Task>(tasksEndpoints.move(id), input),

  assign: (id: string) =>
    apiClient.patch<Task>(tasksEndpoints.assign(id)),

  /** Attache (ou remplace) l'image de la tâche via multipart. */
  uploadImage: (id: string, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return apiClient.post<Task>(tasksEndpoints.image(id), form);
  },

  /** Retire l'image de la tâche. */
  removeImage: (id: string) =>
    apiClient.delete<Task>(tasksEndpoints.image(id)),

  remove: (id: string) => apiClient.delete<void>(tasksEndpoints.byId(id)),
};
