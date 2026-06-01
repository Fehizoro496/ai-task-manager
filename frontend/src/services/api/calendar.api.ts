import { apiClient } from "./client";
import { endpoints } from "./endpoints";

export type CalendarEventVisibility = "PUBLIC" | "RESTRICTED";

export interface CalendarEventUser {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface BaseCalendarEvent {
  id: string;
  title: string;
  date: string | null;
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
}

export interface TaskCalendarEvent extends BaseCalendarEvent {
  type: "task_due";
  taskId: string;
  identifier: string | null;
  dueDate: string | null;
  status: "todo" | "in_progress" | "in_review" | "done";
  priority: "urgent" | "high" | "medium" | "low";
  assignee: CalendarEventUser | null;
}

export interface CustomCalendarEvent extends BaseCalendarEvent {
  type: "custom";
  eventId: string;
  description: string | null;
  visibility: CalendarEventVisibility;
  createdBy: CalendarEventUser;
  viewers: CalendarEventUser[];
  canDelete: boolean;
  createdAt: string;
}

export type CalendarEvent = TaskCalendarEvent | CustomCalendarEvent;

export interface CreateCalendarEventInput {
  title: string;
  date: string;
  description?: string;
  projectId?: string | null;
  visibility: CalendarEventVisibility;
  viewerIds?: string[];
}

export const calendarApi = {
  listEvents: (from: string, to: string) =>
    apiClient.get<{ events: CalendarEvent[] }>(
      endpoints.calendar.events(from, to),
    ),

  create: (input: CreateCalendarEventInput) =>
    apiClient.post<{ event: CustomCalendarEvent }>(
      endpoints.calendar.createEvent(),
      input,
    ),

  remove: (id: string) =>
    apiClient.delete<{ id: string }>(endpoints.calendar.eventById(id)),
};
