import { apiClient } from "./client";
import { endpoints } from "./endpoints";

export interface CalendarEvent {
  id: string;
  type: "task_due";
  taskId: string;
  identifier: string | null;
  title: string;
  date: string;
  dueDate: string | null;
  status: "todo" | "in_progress" | "in_review" | "done";
  priority: "urgent" | "high" | "medium" | "low";
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
  assignee:
    | { id: string; name: string; avatar_url: string | null }
    | null;
}

export const calendarApi = {
  listEvents: (from: string, to: string) =>
    apiClient.get<{ events: CalendarEvent[] }>(
      endpoints.calendar.events(from, to),
    ),
};
