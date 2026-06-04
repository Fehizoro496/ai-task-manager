import { apiClient } from "./client";
import { endpoints } from "./endpoints";

export interface ScoreBreakdown {
  skill: number;
  availability: number;
  performance: number;
}

export interface AssigneeSuggestion {
  id: string;
  name: string;
  avatar_url: string | null;
  load: number;
  capacity: number;
  score: number;
  breakdown: ScoreBreakdown;
}

export interface SuggestResponse {
  taskId: string;
  projectId: string;
  labels: string[];
  suggestions: AssigneeSuggestion[];
}

export interface DistributionAssignment {
  taskId: string;
  identifier: string | null;
  title: string;
  labels: string[];
  assignee: { id: string; name: string; avatar_url: string | null };
  score: number;
  breakdown: ScoreBreakdown;
}

export interface DistributionPreview {
  projectId: string;
  assignments: DistributionAssignment[];
  unassignedCount: number;
}

export const distributionApi = {
  suggestAssignee: (taskId: string) =>
    apiClient.get<SuggestResponse>(
      endpoints.distribution.suggestAssignee(taskId),
    ),

  distribute: (projectId: string, taskIds?: string[]) =>
    apiClient.post<DistributionPreview>(
      endpoints.distribution.distribute(projectId),
      taskIds ? { taskIds } : {},
    ),

  apply: (
    projectId: string,
    assignments: { taskId: string; userId: string }[],
  ) =>
    apiClient.post<{ updated: number }>(
      endpoints.distribution.applyDistribution(projectId),
      { assignments },
    ),
};
