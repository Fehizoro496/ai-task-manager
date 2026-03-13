import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/network/api_client.dart';
import 'package:ai_task_manager/features/notifications/data/notifications_api.dart';
import 'package:ai_task_manager/features/notifications/model/notification_entity.dart';
import 'package:ai_task_manager/features/notifications/model/notification_model.dart';

class NotificationService {
  final ApiClient _apiClient;

  const NotificationService({required ApiClient apiClient})
      : _apiClient = apiClient;

  Future<List<NotificationEntity>> getNotifications() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        NotificationsApi.list,
      );
      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }
      final list = response.data!['notifications'] as List<dynamic>;
      return list
          .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<NotificationEntity> markAsRead(String id) async {
    try {
      final response = await _apiClient.patch<Map<String, dynamic>>(
        NotificationsApi.markRead(id),
      );
      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }
      return NotificationModel.fromJson(
          response.data!['notification'] as Map<String, dynamic>);
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _apiClient.patch<Map<String, dynamic>>(
        NotificationsApi.markAllRead,
      );
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }
}
