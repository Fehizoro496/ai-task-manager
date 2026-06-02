import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { Epic } from "./types";

export interface CreateEpicInput {
  title: string;
  projectId: string;
  description?: string;
  position?: number;
}

export interface UpdateEpicInput {
  title?: string;
  description?: string;
  position?: number;
}

export const epicsApi = {
  listByProject: (projectId: string) =>
    apiClient.get<Epic[]>(endpoints.epics.listByProject(projectId)),

  getById: (id: string) => apiClient.get<Epic>(endpoints.epics.byId(id)),

  create: (input: CreateEpicInput) =>
    apiClient.post<Epic>(endpoints.epics.root(), input),

  update: (id: string, input: UpdateEpicInput) =>
    apiClient.put<Epic>(endpoints.epics.byId(id), input),

  remove: (id: string) => apiClient.delete<void>(endpoints.epics.byId(id)),
};
