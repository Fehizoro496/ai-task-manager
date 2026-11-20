export const aiEndpoints = {
  generatePlan: () => "/api/ai/generate-plan",
  drafts: () => "/api/ai/drafts",
  draftById: (id: string) => `/api/ai/drafts/${id}`,
  approveDraft: (id: string) => `/api/ai/drafts/${id}/approve`,
  rejectDraft: (id: string) => `/api/ai/drafts/${id}/reject`,
  refineDraft: (id: string) => `/api/ai/drafts/${id}/refine`,
  listDraftsByProject: (projectId: string) =>
    `/api/ai/drafts?projectId=${encodeURIComponent(projectId)}`,
} as const;
