import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { Story } from "./types";

export interface CreateStoryInput {
  title: string;
  epicId: string;
  description?: string;
  position?: number;
}

export interface UpdateStoryInput {
  title?: string;
  description?: string;
  position?: number;
}

export const storiesApi = {
  listByEpic: (epicId: string) =>
    apiClient.get<Story[]>(endpoints.stories.listByEpic(epicId)),

  getById: (id: string) => apiClient.get<Story>(endpoints.stories.byId(id)),

  create: (input: CreateStoryInput) =>
    apiClient.post<Story>(endpoints.stories.root(), input),

  update: (id: string, input: UpdateStoryInput) =>
    apiClient.put<Story>(endpoints.stories.byId(id), input),

  remove: (id: string) => apiClient.delete<void>(endpoints.stories.byId(id)),
};
