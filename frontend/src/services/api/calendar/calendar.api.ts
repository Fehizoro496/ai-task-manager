import { apiClient } from "../core";
import { calendarEndpoints } from "./calendar.endpoints";
import type {
  CalendarEvent,
  CreateCalendarEventInput,
  CustomCalendarEvent,
} from "./calendar.types";

export const calendarApi = {
  listEvents: (from: string, to: string) =>
    apiClient.get<{ events: CalendarEvent[] }>(
      calendarEndpoints.events(from, to),
    ),

  create: (input: CreateCalendarEventInput) =>
    apiClient.post<{ event: CustomCalendarEvent }>(
      calendarEndpoints.createEvent(),
      input,
    ),

  remove: (id: string) =>
    apiClient.delete<{ id: string }>(calendarEndpoints.eventById(id)),
};
