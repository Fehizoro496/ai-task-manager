import type { UUID } from "../core";

export interface AiDraft {
  id: UUID;
  projectId: UUID;
  project_id?: UUID;
  document?: string;
  input_document?: string;
  /** Plan généré (structure { tasks: [...] }). `generated_plan` en est l'alias. */
  plan?: unknown;
  generated_plan?: unknown;
  approved?: boolean;
  status?: "pending" | "generated" | "approved";
  /** Fil de discussion de raffinement (persisté). */
  messages?: AiDraftMessage[];
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface AiDraftMessage {
  id: UUID;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface GeneratePlanInput {
  projectId?: string;
  project_id?: string;
  document: string;
}
