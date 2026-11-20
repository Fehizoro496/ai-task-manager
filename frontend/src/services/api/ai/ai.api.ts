import { apiClient } from "../core";
import { aiEndpoints } from "./ai.endpoints";
import type { AiDraft, GeneratePlanInput } from "./ai.types";

export const aiApi = {
  generatePlan: (input: GeneratePlanInput) =>
    apiClient.post<AiDraft>(aiEndpoints.generatePlan(), input),

  listDrafts: (projectId?: string) =>
    apiClient.get<AiDraft[]>(
      projectId
        ? aiEndpoints.listDraftsByProject(projectId)
        : aiEndpoints.drafts(),
    ),

  getDraft: (id: string) =>
    apiClient.get<AiDraft>(aiEndpoints.draftById(id)),

  updateDraftPlan: (id: string, plan: unknown) =>
    apiClient.patch<AiDraft>(aiEndpoints.draftById(id), { plan }),

  approveDraft: (id: string) =>
    apiClient.post<unknown>(aiEndpoints.approveDraft(id)),

  rejectDraft: (id: string) =>
    apiClient.post<{ message: string }>(aiEndpoints.rejectDraft(id)),

  refineDraft: (id: string, instruction: string) =>
    apiClient.post<AiDraft>(aiEndpoints.refineDraft(id), { instruction }),
};
