import { apiClient } from "./client";
import { endpoints } from "./endpoints";

export interface Label {
  id: string;
  name: string;
}

export const labelsApi = {
  listAll: () => apiClient.get<{ labels: Label[] }>(endpoints.labels.root()),

  create: (name: string) =>
    apiClient.post<Label>(endpoints.labels.root(), { name }),

  remove: (id: string) =>
    apiClient.delete<{ id: string }>(endpoints.labels.byId(id)),
};
