import 'package:ai_task_manager/core/utils/typedefs.dart';

import 'notification_entity.dart';

class NotificationModel extends NotificationEntity {
  const NotificationModel({
    required super.id,
    required super.type,
    required super.title,
    required super.message,
    required super.userId,
    required super.taskId,
    required super.link,
    required super.isRead,
    required super.createdAt,
  });

  factory NotificationModel.fromJson(DataMap json) {
    return NotificationModel(
      id: json['id'] as String,
      type: _typeFromJson(json['type'] as String),
      title: json['title'] as String,
      message: json['message'] as String,
      userId: json['userId'] as String,
      taskId: json['taskId'] as String,
      link: json['link'] as String,
      isRead: json['isRead'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  DataMap toJson() => {
        'id': id,
        'type': _typeToJson(type),
        'title': title,
        'message': message,
        'userId': userId,
        'taskId': taskId,
        'link': link,
        'isRead': isRead,
        'createdAt': createdAt.toIso8601String(),
      };

  static NotificationType _typeFromJson(String value) {
    switch (value) {
      case 'TASK_ASSIGNED':
        return NotificationType.taskAssigned;
      case 'TASK_STATUS_CHANGED':
        return NotificationType.taskStatusChanged;
      case 'TASK_UPDATED':
      default:
        return NotificationType.taskUpdated;
    }
  }

  static String _typeToJson(NotificationType type) {
    switch (type) {
      case NotificationType.taskAssigned:
        return 'TASK_ASSIGNED';
      case NotificationType.taskStatusChanged:
        return 'TASK_STATUS_CHANGED';
      case NotificationType.taskUpdated:
        return 'TASK_UPDATED';
    }
  }
}
