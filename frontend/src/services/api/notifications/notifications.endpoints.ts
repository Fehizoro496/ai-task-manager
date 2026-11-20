export const notificationsEndpoints = {
  root: () => "/api/notifications",
  markRead: (id: string) => `/api/notifications/${id}/read`,
  markAllRead: () => "/api/notifications/read-all",
} as const;
