import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { Conversation, Message } from "./types";

export const chatApi = {
  listConversations: () =>
    apiClient.get<{ conversations: Conversation[] }>(
      endpoints.chat.conversations(),
    ),

  createDM: (otherUserId: string) =>
    apiClient.post<{ conversation: Conversation }>(
      endpoints.chat.conversations(),
      { otherUserId },
    ),

  listMessages: (conversationId: string) =>
    apiClient.get<{ messages: Message[] }>(
      endpoints.chat.messages(conversationId),
    ),

  sendMessage: (conversationId: string, content: string) =>
    apiClient.post<{ message: Message }>(endpoints.chat.messages(conversationId), {
      content,
    }),

  markRead: (conversationId: string) =>
    apiClient.post<{ conversationId: string }>(endpoints.chat.read(conversationId)),
};
