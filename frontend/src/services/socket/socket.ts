import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "../config";
import { tokenStorage } from "../api/client";

let socket: Socket | null = null;

export interface ConnectOptions {
  token?: string | null;
}

export const socketService = {
  connect(options: ConnectOptions = {}): Socket {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
      auth: { token: options.token ?? tokenStorage.get() },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    return socket;
  },

  get(): Socket | null {
    return socket;
  },

  disconnect() {
    socket?.disconnect();
    socket = null;
  },

  joinConversation(conversationId: string) {
    socket?.emit("join_conversation", conversationId);
  },

  leaveConversation(conversationId: string) {
    socket?.emit("leave_conversation", conversationId);
  },
};
