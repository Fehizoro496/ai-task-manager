import { apiClient } from "../core";
import { labelsEndpoints } from "./labels.endpoints";
import type { Label } from "./labels.types";

export const labelsApi = {
  listAll: () => apiClient.get<{ labels: Label[] }>(labelsEndpoints.root()),

  create: (name: string) =>
    apiClient.post<Label>(labelsEndpoints.root(), { name }),

  remove: (id: string) =>
    apiClient.delete<{ id: string }>(labelsEndpoints.byId(id)),
};
