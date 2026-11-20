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
