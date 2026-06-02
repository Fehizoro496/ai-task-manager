import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { Notification } from "./types";

export const notificationsApi = {
  list: () =>
    apiClient.get<{ notifications: Notification[] }>(
      endpoints.notifications.root(),
    ),

  markRead: (id: string) =>
    apiClient.patch<{ notification: Notification }>(
      endpoints.notifications.markRead(id),
    ),

  markAllRead: () =>
    apiClient.patch<{ message: string }>(endpoints.notifications.markAllRead()),
};
