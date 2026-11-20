import { apiClient } from "../core";
import { commentsEndpoints } from "./comments.endpoints";
import type { TaskComment } from "./comments.types";

export const commentsApi = {
  list: (taskId: string) =>
    apiClient.get<{ comments: TaskComment[] }>(
      commentsEndpoints.listForTask(taskId),
    ),

  create: (taskId: string, body: string) =>
    apiClient.post<TaskComment>(commentsEndpoints.createForTask(taskId), {
      body,
    }),

  remove: (id: string) =>
    apiClient.delete<void>(commentsEndpoints.byId(id)),
};
