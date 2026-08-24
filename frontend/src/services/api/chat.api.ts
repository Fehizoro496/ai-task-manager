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

  sendMessage: (conversationId: string, content: string, files?: File[]) => {
    // Avec pièces jointes → multipart ; sinon JSON classique.
    if (files && files.length > 0) {
      const form = new FormData();
      form.append("content", content);
      for (const file of files) form.append("files", file);
      return apiClient.post<{ message: Message }>(
        endpoints.chat.messages(conversationId),
        form,
      );
    }
    return apiClient.post<{ message: Message }>(
      endpoints.chat.messages(conversationId),
      { content },
    );
  },

  deleteMessage: (messageId: string) =>
    apiClient.delete<{ message: Message }>(endpoints.chat.message(messageId)),

  markRead: (conversationId: string) =>
    apiClient.post<{ conversationId: string }>(endpoints.chat.read(conversationId)),
};
