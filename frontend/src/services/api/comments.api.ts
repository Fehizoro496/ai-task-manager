import { apiClient } from "./client";
import { endpoints } from "./endpoints";

export interface TaskComment {
  id: string;
  taskId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

export const commentsApi = {
  list: (taskId: string) =>
    apiClient.get<{ comments: TaskComment[] }>(
      endpoints.comments.listForTask(taskId),
    ),

  create: (taskId: string, body: string) =>
    apiClient.post<TaskComment>(endpoints.comments.createForTask(taskId), {
      body,
    }),

  remove: (id: string) =>
    apiClient.delete<void>(endpoints.comments.byId(id)),
};
