"use client";
import { useCallback, useEffect, useState } from "react";
import { notificationsApi } from "../api/notifications.api";
import type { Notification } from "../api/types";
import { useAuthStore } from "../auth/auth-store";
import { socketService } from "../socket";

export function useNotifications() {
  const isAuth = useAuthStore((s) => s.status === "authenticated");
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications } = await notificationsApi.list();
      setItems(notifications);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuth) refetch();
  }, [isAuth, refetch]);

  // Live updates : insertion en tête lors d'un évènement notification:new.
  useEffect(() => {
    if (!isAuth) return;
    const off = socketService.on("notification:new", (n: unknown) => {
      const incoming = n as Notification;
      setItems((curr) => {
        if (curr.some((x) => x.id === incoming.id)) return curr;
        return [incoming, ...curr];
      });
    });
    return off;
  }, [isAuth]);

  const markRead = useCallback(async (id: string) => {
    await notificationsApi.markRead(id);
    setItems((curr) => curr.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setItems((curr) => curr.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  return { items, loading, refetch, markRead, markAllRead, unreadCount };
}
