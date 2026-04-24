import 'package:ai_task_manager/core/utils/typedefs.dart';
import 'package:ai_task_manager/features/tasks/model/task_entity.dart';

class TaskModel extends TaskEntity {
  const TaskModel({
    required super.id,
    super.identifier,
    super.githubBranch,
    required super.title,
    super.description,
    super.status,
    super.priority,
    super.storyId,
    required super.projectId,
    super.assigneeId,
    super.assigneeName,
    super.assigneeAvatar,
    super.labels,
    super.order,
    super.dueDate,
    required super.createdAt,
    required super.updatedAt,
  });

  factory TaskModel.fromJson(DataMap json) {
    final assigneeJson = json['assignee'] as Map<String, dynamic>?;
    return TaskModel(
      id: json['id'] as String,
      identifier: json['identifier'] as String?,
      githubBranch: (json['githubBranch'] ?? json['github_branch']) as String?,
      title: json['title'] as String,
      description: json['description'] as String?,
      status: _statusFromString(json['status'] as String? ?? 'todo'),
      priority: _priorityFromString(json['priority'] as String? ?? 'medium'),
      storyId: (json['storyId'] ?? json['story_id']) as String?,
      projectId: (json['projectId'] ?? json['project_id'] ?? '') as String,
      assigneeId: (json['assigneeId'] ?? json['assignee_id']) as String?,
      assigneeName: assigneeJson?['name'] as String?,
      assigneeAvatar: assigneeJson?['avatar_url'] as String?,
      labels: (json['labels'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      order: (json['position'] ?? json['order'] ?? 0) as int,
      dueDate: (json['dueDate'] ?? json['due_date']) != null
          ? DateTime.parse((json['dueDate'] ?? json['due_date']) as String)
          : null,
      createdAt: DateTime.parse((json['createdAt'] ?? json['created_at']) as String),
      updatedAt: DateTime.parse((json['updatedAt'] ?? json['updated_at']) as String),
    );
  }

  factory TaskModel.fromEntity(TaskEntity entity) {
    return TaskModel(
      id: entity.id,
      identifier: entity.identifier,
      githubBranch: entity.githubBranch,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      priority: entity.priority,
      storyId: entity.storyId,
      projectId: entity.projectId,
      assigneeId: entity.assigneeId,
      assigneeName: entity.assigneeName,
      assigneeAvatar: entity.assigneeAvatar,
      labels: entity.labels,
      order: entity.order,
      dueDate: entity.dueDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }

  DataMap toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'status': statusToString(status),
      'priority': priorityToString(priority),
      'story_id': storyId,
      'project_id': projectId,
      'assignee_id': assigneeId,
      'labels': labels,
      'order': order,
      'due_date': dueDate?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  static TaskStatus _statusFromString(String value) {
    switch (value.toLowerCase()) {
      case 'todo':
        return TaskStatus.todo;
      case 'in_progress':
      case 'inprogress':
        return TaskStatus.inProgress;
      case 'in_review':
      case 'inreview':
        return TaskStatus.inReview;
      case 'done':
        return TaskStatus.done;
      default:
        return TaskStatus.todo;
    }
  }

  static String statusToString(TaskStatus status) {
    switch (status) {
      case TaskStatus.todo:
        return 'todo';
      case TaskStatus.inProgress:
        return 'in_progress';
      case TaskStatus.inReview:
        return 'in_review';
      case TaskStatus.done:
        return 'done';
    }
  }

  static TaskPriority _priorityFromString(String value) {
    switch (value.toLowerCase()) {
      case 'urgent':
        return TaskPriority.urgent;
      case 'high':
        return TaskPriority.high;
      case 'medium':
        return TaskPriority.medium;
      case 'low':
        return TaskPriority.low;
      default:
        return TaskPriority.medium;
    }
  }

  static String priorityToString(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.urgent:
        return 'urgent';
      case TaskPriority.high:
        return 'high';
      case TaskPriority.medium:
        return 'medium';
      case TaskPriority.low:
        return 'low';
    }
  }
}
