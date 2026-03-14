import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/network/api_client.dart';
import 'package:ai_task_manager/features/messages/data/chat_api.dart';
import 'package:ai_task_manager/features/messages/model/conversation_entity.dart';
import 'package:ai_task_manager/features/messages/model/conversation_model.dart';
import 'package:ai_task_manager/features/messages/model/message_entity.dart';
import 'package:ai_task_manager/features/messages/model/message_model.dart';

class ChatService {
  final ApiClient _apiClient;

  const ChatService({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<ConversationEntity>> getConversations() async {
    try {
      final response =
          await _apiClient.get<Map<String, dynamic>>(ChatApi.conversations);
      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }
      final list = response.data!['conversations'] as List<dynamic>;
      return list
          .map((e) => ConversationModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<ConversationEntity> createDM(String otherUserId) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ChatApi.conversations,
        data: {'otherUserId': otherUserId},
      );
      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }
      return ConversationModel.fromJson(
          response.data!['conversation'] as Map<String, dynamic>);
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<List<MessageEntity>> getMessages(String conversationId) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        ChatApi.conversationMessages(conversationId),
      );
      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }
      final list = response.data!['messages'] as List<dynamic>;
      return list
          .map((e) => MessageModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<MessageEntity> sendMessage(
      String conversationId, String content) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ChatApi.conversationMessages(conversationId),
        data: {'content': content},
      );
      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }
      return MessageModel.fromJson(
          response.data!['message'] as Map<String, dynamic>);
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }
}
