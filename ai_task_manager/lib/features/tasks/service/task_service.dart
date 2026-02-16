import 'dart:convert';

import 'package:drift/drift.dart';

import 'package:ai_task_manager/core/database/app_database.dart';
import 'package:ai_task_manager/core/database/daos/task_dao.dart';
import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/network/api_client.dart';
import 'package:ai_task_manager/features/tasks/model/task_entity.dart';
import 'package:ai_task_manager/features/tasks/model/task_model.dart';

class TaskService {
  final ApiClient _apiClient;
  final TasksDao _tasksDao;

  const TaskService({
    required ApiClient apiClient,
    required TasksDao tasksDao,
  })  : _apiClient = apiClient,
        _tasksDao = tasksDao;

  Future<List<TaskEntity>> getTasksByProject(String projectId) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        '/projects/$projectId/tasks',
      );

      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }

      final tasks = (response.data!['tasks'] as List<dynamic>)
          .map((json) => TaskModel.fromJson(json as Map<String, dynamic>))
          .toList();

      // Cache locally
      for (final task in tasks) {
        await _insertTaskToCache(task);
      }

      return tasks;
    } on ServerException {
      // Fallback to cache
      return _getCachedTasks(projectId);
    } catch (e) {
      try {
        return await _getCachedTasks(projectId);
      } catch (_) {
        throw ServerException(message: e.toString());
      }
    }
  }

  Future<TaskEntity> createTask({
    required String title,
    String? description,
    required String projectId,
    TaskPriority priority = TaskPriority.medium,
    String? storyId,
  }) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/projects/$projectId/tasks',
        data: {
          'title': title,
          'description': description,
          'priority': TaskModel.priorityToString(priority),
          'story_id': storyId,
        },
      );

      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }

      final task = TaskModel.fromJson(response.data!);
      await _insertTaskToCache(task);
      return task;
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<TaskEntity> updateTask(TaskEntity task) async {
    try {
      final model = TaskModel.fromEntity(task);
      final response = await _apiClient.put<Map<String, dynamic>>(
        '/tasks/${task.id}',
        data: model.toJson(),
      );

      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }

      final updated = TaskModel.fromJson(response.data!);
      await _updateTaskInCache(updated);
      return updated;
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<void> deleteTask(String id) async {
    try {
      await _apiClient.delete<void>('/tasks/$id');
      await _tasksDao.deleteTask(id);
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<void> moveTask(
    String taskId,
    TaskStatus newStatus,
    int newOrder,
  ) async {
    try {
      await _apiClient.patch<void>(
        '/tasks/$taskId/move',
        data: {
          'status': TaskModel.statusToString(newStatus),
          'order': newOrder,
        },
      );
      await _tasksDao.updateTaskStatus(
          taskId, TaskModel.statusToString(newStatus));
      await _tasksDao.reorderTask(taskId, newOrder);
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Stream<List<TaskEntity>> watchTasksByProject(String projectId) {
    return _tasksDao.watchTasksByProject(projectId).map(
          (rows) => rows.map(_taskRowToModel).toList(),
        );
  }

  Future<void> _insertTaskToCache(TaskModel task) async {
    try {
      await _tasksDao.insertTask(_taskModelToCompanion(task));
    } catch (_) {}
  }

  Future<void> _updateTaskInCache(TaskModel task) async {
    try {
      await _tasksDao.updateTask(_taskModelToCompanion(task));
    } catch (_) {}
  }

  Future<List<TaskModel>> _getCachedTasks(String projectId) async {
    final rows = await _tasksDao.getTasksByProject(projectId);
    return rows.map(_taskRowToModel).toList();
  }

  TaskModel _taskRowToModel(Task row) {
    List<String> labels = const [];
    if (row.labels != null && row.labels!.isNotEmpty) {
      try {
        labels = (jsonDecode(row.labels!) as List<dynamic>)
            .map((e) => e as String)
            .toList();
      } catch (_) {
        labels = const [];
      }
    }

    return TaskModel(
      id: row.id,
      title: row.title,
      description: row.description,
      status: _statusFromString(row.status),
      priority: _priorityFromString(row.priority),
      storyId: row.storyId,
      projectId: row.projectId,
      assigneeId: row.assigneeId,
      labels: labels,
      order: row.order,
      dueDate: row.dueDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    );
  }

  TasksCompanion _taskModelToCompanion(TaskModel task) {
    return TasksCompanion(
      id: Value(task.id),
      title: Value(task.title),
      description: Value(task.description),
      status: Value(TaskModel.statusToString(task.status)),
      priority: Value(TaskModel.priorityToString(task.priority)),
      storyId: Value(task.storyId),
      projectId: Value(task.projectId),
      assigneeId: Value(task.assigneeId),
      labels: Value(task.labels.isNotEmpty ? jsonEncode(task.labels) : null),
      order: Value(task.order),
      dueDate: Value(task.dueDate),
      createdAt: Value(task.createdAt),
      updatedAt: Value(task.updatedAt),
    );
  }

  static TaskStatus _statusFromString(String value) => switch (value) {
        'todo' => TaskStatus.todo,
        'in_progress' => TaskStatus.inProgress,
        'in_review' => TaskStatus.inReview,
        'done' => TaskStatus.done,
        _ => TaskStatus.todo,
      };

  static TaskPriority _priorityFromString(String value) => switch (value) {
        'urgent' => TaskPriority.urgent,
        'high' => TaskPriority.high,
        'medium' => TaskPriority.medium,
        'low' => TaskPriority.low,
        _ => TaskPriority.medium,
      };
}
