import type { UUID } from "../core";

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: UUID;
  identifier?: string | null;
  title: string;
  description: string | null;
  /** Image jointe, URL relative à l'hôte backend (/uploads/tasks/...). */
  imageUrl?: string | null;
  status: TaskStatus;
  priority: TaskPriority | null;
  position: number;
  projectId: UUID | null;
  assigneeId: UUID | null;
  assignee?: {
    id: UUID;
    name: string;
    avatar_url: string | null;
  } | null;
  labels: string[];
  commentsCount?: number;
  /** Projet porteur, renvoyé par les endpoints qui incluent la relation. */
  project?: { id: UUID; name: string; color: string | null } | null;
  dueDate: string | null;
  createdAt?: string;
  branch?: string | null;
  githubBranch?: string | null;
  githubBranchUrl?: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId?: string;
  priority?: TaskPriority;
  position?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus | Uppercase<TaskStatus>;
  position?: number;
  priority?: TaskPriority;
  assigneeId?: string | null;
  labels?: string[];
  dueDate?: string | null;
}

export interface MoveTaskInput {
  status: TaskStatus;
  order?: number;
}

export type MyTasksScope = "all" | "active" | "done";
export type MyTasksSort = "due_asc" | "due_desc" | "priority" | "recent";

/**
 * Filtres de la page « Mes tâches ». Tout est appliqué côté serveur : la
 * réponse est déjà filtrée, triée et découpée en pages.
 */
export interface MyTasksQuery {
  scope?: MyTasksScope;
  q?: string;
  /** Priorités retenues — sérialisées en CSV. */
  priorities?: TaskPriority[];
  /** Projets retenus — sérialisés en CSV. */
  projectIds?: string[];
  sort?: MyTasksSort;
  limit?: number;
  offset?: number;
}

export interface MyTasksPage {
  tasks: Task[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
