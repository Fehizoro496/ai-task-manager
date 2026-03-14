class ChatApi {
  ChatApi._();

  static const String conversations = '/chat/conversations';

  static String conversationMessages(String id) =>
      '/chat/conversations/$id/messages';
}
