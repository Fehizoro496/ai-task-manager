"use client";
import { useEffect } from "react";
import { create } from "zustand";
import { chatApi } from "../api/chat.api";
import type { Message } from "../api/types";
import { useAuthStore } from "../auth/auth-store";
import { socketService } from "../socket/socket";

interface UnreadMessagesState {
  perConv: Record<string, number>;
  total: number;
  refresh: () => Promise<void>;
  bumpFromMessage: (msg: Message, currentUserId: string) => void;
  clearForConv: (conversationId: string) => void;
}

const computeTotal = (per: Record<string, number>) =>
  Object.values(per).reduce((sum, n) => sum + n, 0);

export const useUnreadMessagesStore = create<UnreadMessagesState>((set, get) => ({
  perConv: {},
  total: 0,

  refresh: async () => {
    try {
      const { conversations } = await chatApi.listConversations();
      const perConv: Record<string, number> = {};
      for (const c of conversations) {
        if (c.unreadCount > 0) perConv[c.id] = c.unreadCount;
      }
      set({ perConv, total: computeTotal(perConv) });
    } catch {
      // silencieux — non-auth ou hors-ligne
    }
  },

  bumpFromMessage: (msg, currentUserId) => {
    if (!msg?.conversationId) return;
    if (msg.senderId === currentUserId) return;
    const { perConv } = get();
    const next = { ...perConv, [msg.conversationId]: (perConv[msg.conversationId] ?? 0) + 1 };
    set({ perConv: next, total: computeTotal(next) });
  },

  clearForConv: (conversationId) => {
    const { perConv } = get();
    if (!perConv[conversationId]) return;
    const next = { ...perConv };
    delete next[conversationId];
    set({ perConv: next, total: computeTotal(next) });
  },
}));

/**
 * Hook à monter une seule fois (sidebar). Charge les compteurs initiaux,
 * écoute les `new_message` socket et tient à jour le total non lu.
 * `conversation:read` arrive depuis le backend après markRead → on vide la conv.
 */
export function useUnreadMessagesWatcher() {
  const isAuth = useAuthStore((s) => s.status === "authenticated");
  const userId = useAuthStore((s) => s.user?.id);
  const refresh = useUnreadMessagesStore((s) => s.refresh);
  const bumpFromMessage = useUnreadMessagesStore((s) => s.bumpFromMessage);
  const clearForConv = useUnreadMessagesStore((s) => s.clearForConv);

  useEffect(() => {
    if (!isAuth || !userId) return;
    refresh();

    // Recharge les compteurs à chaque (re)connexion socket. Couvre les
    // messages reçus entre l'auth REST et le handshake websocket, ainsi
    // que les messages manqués pendant une déconnexion temporaire.
    const offConnect = socketService.on("connect", () => {
      refresh();
    });
    const offMsg = socketService.on("new_message", (payload: unknown) => {
      bumpFromMessage(payload as Message, userId);
    });
    const offRead = socketService.on("conversation:read", (payload: unknown) => {
      const p = payload as { conversationId?: string };
      if (p?.conversationId) clearForConv(p.conversationId);
    });

    return () => {
      offConnect();
      offMsg();
      offRead();
    };
  }, [isAuth, userId, refresh, bumpFromMessage, clearForConv]);
}
