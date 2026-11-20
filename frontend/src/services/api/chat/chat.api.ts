import { apiClient } from "../core";
import { chatEndpoints } from "./chat.endpoints";
import type { Conversation, Message } from "./chat.types";

export const chatApi = {
  listConversations: () =>
    apiClient.get<{ conversations: Conversation[] }>(
      chatEndpoints.conversations(),
    ),

  createDM: (otherUserId: string) =>
    apiClient.post<{ conversation: Conversation }>(
      chatEndpoints.conversations(),
      { otherUserId },
    ),

  listMessages: (conversationId: string) =>
    apiClient.get<{ messages: Message[] }>(
      chatEndpoints.messages(conversationId),
    ),

  sendMessage: (conversationId: string, content: string, files?: File[]) => {
    // Avec pièces jointes → multipart ; sinon JSON classique.
    if (files && files.length > 0) {
      const form = new FormData();
      form.append("content", content);
      for (const file of files) form.append("files", file);
      return apiClient.post<{ message: Message }>(
        chatEndpoints.messages(conversationId),
        form,
      );
    }
    return apiClient.post<{ message: Message }>(
      chatEndpoints.messages(conversationId),
      { content },
    );
  },

  deleteMessage: (messageId: string) =>
    apiClient.delete<{ message: Message }>(chatEndpoints.message(messageId)),

  markRead: (conversationId: string) =>
    apiClient.post<{ conversationId: string }>(chatEndpoints.read(conversationId)),
};
