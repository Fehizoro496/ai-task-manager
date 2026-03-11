import 'package:equatable/equatable.dart';

enum TaskStatus { todo, inProgress, inReview, done }

enum TaskPriority { urgent, high, medium, low }

class TaskEntity extends Equatable {
  final String id;
  final String title;
  final String? description;
  final TaskStatus status;
  final TaskPriority priority;
  final String? storyId;
  final String projectId;
  final String? assigneeId;
  final String? assigneeName;
  final String? assigneeAvatar;
  final List<String> labels;
  final int order;
  final DateTime? dueDate;
  final DateTime createdAt;
  final DateTime updatedAt;

  const TaskEntity({
    required this.id,
    required this.title,
    this.description,
    this.status = TaskStatus.todo,
    this.priority = TaskPriority.medium,
    this.storyId,
    required this.projectId,
    this.assigneeId,
    this.assigneeName,
    this.assigneeAvatar,
    this.labels = const [],
    this.order = 0,
    this.dueDate,
    required this.createdAt,
    required this.updatedAt,
  });

  TaskEntity copyWith({
    String? title,
    String? description,
    TaskStatus? status,
    TaskPriority? priority,
    Object? assigneeId = _keep,
    Object? assigneeName = _keep,
    Object? assigneeAvatar = _keep,
    List<String>? labels,
    int? order,
    DateTime? dueDate,
  }) =>
      TaskEntity(
        id: id,
        title: title ?? this.title,
        description: description ?? this.description,
        status: status ?? this.status,
        priority: priority ?? this.priority,
        storyId: storyId,
        projectId: projectId,
        assigneeId: assigneeId == _keep ? this.assigneeId : assigneeId as String?,
        assigneeName: assigneeName == _keep ? this.assigneeName : assigneeName as String?,
        assigneeAvatar: assigneeAvatar == _keep ? this.assigneeAvatar : assigneeAvatar as String?,
        labels: labels ?? this.labels,
        order: order ?? this.order,
        dueDate: dueDate ?? this.dueDate,
        createdAt: createdAt,
        updatedAt: DateTime.now(),
      );

  static const Object _keep = Object();

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        status,
        priority,
        storyId,
        projectId,
        assigneeId,
        assigneeName,
        assigneeAvatar,
        labels,
        order,
        dueDate,
      ];
}
