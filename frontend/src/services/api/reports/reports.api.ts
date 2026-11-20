import { apiClient } from "../core";
import { reportsEndpoints } from "./reports.endpoints";
import type { ReportsOverview, ReportsRangeQuery } from "./reports.types";

export const reportsApi = {
  overview: (query?: ReportsRangeQuery, signal?: AbortSignal) =>
    apiClient.get<ReportsOverview>(reportsEndpoints.overview(), {
      query: { unit: query?.unit, anchor: query?.anchor },
      signal,
    }),
};
