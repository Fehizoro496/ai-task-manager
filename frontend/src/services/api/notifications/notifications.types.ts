import type { UUID } from "../core";

export interface Notification {
  id: UUID;
  type: string;
  title?: string | null;
  message: string;
  link?: string | null;
  taskId?: string | null;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}
