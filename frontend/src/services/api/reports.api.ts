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
  completed: number;
}

export interface ReportsOverview {
  totals: ReportTotals;
  byStatus: DistributionItem[];
  byPriority: DistributionItem[];
  byProject: ProjectBreakdown[];
  topAssignees: AssigneeStat[];
  completionByDay: DayCompletion[];
}

export const reportsApi = {
  overview: () =>
    apiClient.get<ReportsOverview>(endpoints.reports.overview()),
};
