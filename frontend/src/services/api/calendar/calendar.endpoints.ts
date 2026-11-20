export const calendarEndpoints = {
  events: (from: string, to: string) =>
    `/api/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  createEvent: () => "/api/calendar/events",
  eventById: (id: string) => `/api/calendar/events/${id}`,
} as const;
