import { apiClient } from "../core";
import { notificationsEndpoints } from "./notifications.endpoints";
import type { Notification } from "./notifications.types";

export const notificationsApi = {
  list: () =>
    apiClient.get<{ notifications: Notification[] }>(
      notificationsEndpoints.root(),
    ),

  markRead: (id: string) =>
    apiClient.patch<{ notification: Notification }>(
      notificationsEndpoints.markRead(id),
    ),

  markAllRead: () =>
    apiClient.patch<{ message: string }>(notificationsEndpoints.markAllRead()),
};
