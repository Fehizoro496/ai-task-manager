import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { AiDraft } from "./types";

export interface GeneratePlanInput {
  projectId?: string;
  project_id?: string;
  document: string;
}

export const aiApi = {
  generatePlan: (input: GeneratePlanInput) =>
    apiClient.post<AiDraft>(endpoints.ai.generatePlan(), input),

  listDrafts: (projectId?: string) =>
    apiClient.get<AiDraft[]>(
      projectId
        ? endpoints.ai.listDraftsByProject(projectId)
        : endpoints.ai.drafts(),
    ),

  getDraft: (id: string) =>
    apiClient.get<AiDraft>(endpoints.ai.draftById(id)),

  approveDraft: (id: string) =>
    apiClient.post<unknown>(endpoints.ai.approveDraft(id)),

  rejectDraft: (id: string) =>
    apiClient.post<{ message: string }>(endpoints.ai.rejectDraft(id)),
};
