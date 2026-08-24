import { apiClient } from "./client";
import { endpoints } from "./endpoints";

export interface ReportTotals {
  tasks: number;
  done: number;
  inProgress: number;
  inReview: number;
  todo: number;
  completionRate: number;
  projects: number;
  members: number;
}

export interface DistributionItem {
  key: string;
  label: string;
  count: number;
}

export interface ProjectBreakdown {
  projectId: string;
  name: string;
  color: string | null;
  total: number;
  done: number;
  active: number;
  review: number;
  todo: number;
}

export interface AssigneeStat {
  userId: string;
  name: string;
  avatar_url: string | null;
  assigned: number;
  done: number;
}

export interface DayCompletion {
  date: string;
  label: string;
  completed: number;
}

export type RangeUnit = "day" | "week" | "month";

/** Période résolue par le serveur (bornes + libellé prêt à afficher). */
export interface ReportsRange {
  unit: RangeUnit;
  anchor: string;
  start: string;
  end: string;
  label: string;
}

/** Paramètres de requête : unité + une date d'ancrage dans la période. */
export interface ReportsRangeQuery {
  unit?: RangeUnit;
  anchor?: string;
}

export interface ReportsOverview {
  totals: ReportTotals;
  byStatus: DistributionItem[];
  byPriority: DistributionItem[];
  byProject: ProjectBreakdown[];
  topAssignees: AssigneeStat[];
  completionByDay: DayCompletion[];
  range: ReportsRange;
}

export const reportsApi = {
  overview: (query?: ReportsRangeQuery, signal?: AbortSignal) =>
    apiClient.get<ReportsOverview>(endpoints.reports.overview(), {
      query: { unit: query?.unit, anchor: query?.anchor },
      signal,
    }),
};
