"use client";
import { useEffect } from "react";
import { create } from "zustand";
import { adminApi } from "../api/admin.api";
import { useAuthStore } from "../auth/auth-store";
import { socketService } from "../socket/socket";

interface PendingUsersState {
  count: number;
  refresh: () => Promise<void>;
}

export const usePendingUsersStore = create<PendingUsersState>((set) => ({
  count: 0,
  refresh: async () => {
    try {
      const { users } = await adminApi.listUsers("PENDING");
      set({ count: users.length });
    } catch {
      // silent — non-admin ou hors-ligne
    }
  },
}));

/**
 * Hook à monter une seule fois (sidebar). Charge le compteur initial puis
 * réagit en push aux events socket émis par le backend lors d'une demande
 * d'approbation ou d'une approbation/rejet.
 */
export function usePendingUsersWatcher() {
  const isAdmin = useAuthStore((s) => s.user?.role === "ADMIN");
  const refresh = usePendingUsersStore((s) => s.refresh);

  useEffect(() => {
    if (!isAdmin) return;
    refresh();

    const offRequest = socketService.on("admin:pending_request", () => refresh());
    const offChanged = socketService.on("admin:pending_changed", () => refresh());

    return () => {
      offRequest();
      offChanged();
    };
  }, [isAdmin, refresh]);
}
