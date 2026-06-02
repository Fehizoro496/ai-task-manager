export type Role = "Administrateur" | "Membre" | "Lecteur";
export type Priority = "urgent" | "elevee" | "moyenne" | "faible";
export type Status = "a_faire" | "en_cours" | "en_revue" | "termine";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  joinedAt: string;
  provider: "GitHub";
}

export interface ProjectStat {
  total: number;
  done: number;
  active: number;
  review: number;
}

export interface Project {
  id: string;
  name: string;
  prefix: string;
  description: string;
  color: string;
  repo: string;
  createdAt: string;
  memberIds: string[];
  category: "produit" | "marque" | "mobile" | "infra";
}

export interface Task {
  id: string;
  code: string;
  projectId: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assigneeId: string;
  dueDate?: string;
  labels: string[];
  branch?: string;
  storyId?: string;
  points?: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  taskId: string;
  actorId: string;
  text: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  taskCode?: string;
  date: string;     // ISO date (yyyy-mm-dd)
  start: string;    // "HH:mm"
  end: string;      // "HH:mm"
  color: "brand" | "apricot" | "sage" | "rose" | "teal";
}

export interface AiConversation {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
}

export interface PlanEpic {
  id: string;
  title: string;
  stories: PlanStory[];
}
export interface PlanStory {
  id: string;
  title: string;
  tasks: PlanTask[];
}
export interface PlanTask {
  id: string;
  title: string;
  priority: Priority;
}
