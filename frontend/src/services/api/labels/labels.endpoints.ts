export const labelsEndpoints = {
  root: () => "/api/labels",
  byId: (id: string) => `/api/labels/${id}`,
} as const;
