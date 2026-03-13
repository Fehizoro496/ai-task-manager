import 'package:equatable/equatable.dart';

enum NotificationType { taskAssigned, taskUpdated, taskStatusChanged }

class NotificationEntity extends Equatable {
  final String id;
  final NotificationType type;
  final String title;
  final String message;
  final String userId;
  final String taskId;
  final String link;
  final bool isRead;
  final DateTime createdAt;

  const NotificationEntity({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.userId,
    required this.taskId,
    required this.link,
    required this.isRead,
    required this.createdAt,
  });

  NotificationEntity copyWith({
    String? id,
    NotificationType? type,
    String? title,
    String? message,
    String? userId,
    String? taskId,
    String? link,
    bool? isRead,
    DateTime? createdAt,
  }) {
    return NotificationEntity(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      message: message ?? this.message,
      userId: userId ?? this.userId,
      taskId: taskId ?? this.taskId,
      link: link ?? this.link,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        type,
        title,
        message,
        userId,
        taskId,
        link,
        isRead,
        createdAt,
      ];
}
