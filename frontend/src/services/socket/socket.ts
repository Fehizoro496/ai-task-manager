import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "../config";
import { tokenStorage } from "../api/client";

type Handler = (...args: unknown[]) => void;

let socket: Socket | null = null;
const subscriptions = new Map<string, Set<Handler>>();

const applyAllSubscriptions = (s: Socket) => {
  for (const [event, handlers] of subscriptions) {
    for (const h of handlers) s.on(event, h);
  }
};

export interface ConnectOptions {
  token?: string | null;
}

export const socketService = {
  connect(options: ConnectOptions = {}): Socket {
    if (socket?.connected) return socket;
    if (socket) socket.disconnect();

    socket = io(SOCKET_URL, {
      auth: { token: options.token ?? tokenStorage.get() },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    // Ré-applique tous les handlers enregistrés en attendant la connexion
    applyAllSubscriptions(socket);
    return socket;
  },

  get(): Socket | null {
    return socket;
  },

  disconnect() {
    if (socket) {
      // Retirer les listeners avant disconnect pour éviter les fuites
      for (const [event, handlers] of subscriptions) {
        for (const h of handlers) socket.off(event, h);
      }
      socket.disconnect();
    }
    socket = null;
  },

  /**
   * Enregistre un handler pour un event. Si le socket n'est pas encore
   * connecté, le handler sera attaché dès la connexion. Retourne un
   * unsubscribe.
   */
  on(event: string, handler: Handler): () => void {
    if (!subscriptions.has(event)) subscriptions.set(event, new Set());
    subscriptions.get(event)!.add(handler);
    socket?.on(event, handler);
    return () => {
      subscriptions.get(event)?.delete(handler);
      socket?.off(event, handler);
    };
  },

  joinConversation(conversationId: string) {
    socket?.emit("join_conversation", conversationId);
  },

  leaveConversation(conversationId: string) {
    socket?.emit("leave_conversation", conversationId);
  },
};
