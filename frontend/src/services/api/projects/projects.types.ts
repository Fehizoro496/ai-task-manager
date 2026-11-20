import type { UUID } from "../core";
import type { TaskStatus } from "../tasks";
import type { User } from "../users";

export interface Project {
  id: UUID;
  name: string;
  description: string | null;
  color?: string | null;
  createdAt: string;
  ownerId?: UUID;
  identifierPrefix?: string | null;
  githubRepoUrl?: string | null;
  githubOwner?: string | null;
  githubRepo?: string | null;
}

export interface ProjectMember {
  id: UUID;
  userId: UUID;
  projectId: UUID;
  user?: User;
}

export type ReorderColumns = Partial<Record<TaskStatus, string[]>>;

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  githubRepoUrl?: string;
  identifierPrefix?: string;
  /** Crée un dépôt GitHub pour le projet (ignoré si githubRepoUrl est fourni). */
  createGithubRepo?: boolean;
}

/**
 * Réponse de création : `githubRepoWarning` est présent quand le dépôt
 * demandé n'a pas pu être créé — le projet, lui, existe bien.
 */
export type CreatedProject = Project & { githubRepoWarning?: string };

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
  githubRepoUrl?: string | null;
  identifierPrefix?: string;
}

export interface CreateProjectTaskInput {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
}
