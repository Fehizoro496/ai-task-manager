import { apiClient } from "../core";
import { distributionEndpoints } from "./distribution.endpoints";
import type { DistributionPreview, SuggestResponse } from "./distribution.types";

export const distributionApi = {
  suggestAssignee: (taskId: string) =>
    apiClient.get<SuggestResponse>(
      distributionEndpoints.suggestAssignee(taskId),
    ),

  distribute: (projectId: string, taskIds?: string[]) =>
    apiClient.post<DistributionPreview>(
      distributionEndpoints.distribute(projectId),
      taskIds ? { taskIds } : {},
    ),

  apply: (
    projectId: string,
    assignments: { taskId: string; userId: string }[],
  ) =>
    apiClient.post<{ updated: number }>(
      distributionEndpoints.applyDistribution(projectId),
      { assignments },
    ),
};
