export const chatEndpoints = {
  conversations: () => "/api/chat/conversations",
  messages: (conversationId: string) =>
    `/api/chat/conversations/${conversationId}/messages`,
  read: (conversationId: string) =>
    `/api/chat/conversations/${conversationId}/read`,
  message: (messageId: string) => `/api/chat/messages/${messageId}`,
} as const;
