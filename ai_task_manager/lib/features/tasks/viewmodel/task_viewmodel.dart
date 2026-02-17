import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/features/tasks/model/task_entity.dart';
import 'package:ai_task_manager/features/tasks/service/task_service.dart';
import 'package:ai_task_manager/shared/providers.dart';

// ---------------------------------------------------------------------------
// Infrastructure providers
// ---------------------------------------------------------------------------

final taskServiceProvider = Provider<TaskService>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return TaskService(
    apiClient: ref.watch(apiClientProvider),
    tasksDao: db.tasksDao,
  );
});

// ---------------------------------------------------------------------------
// Board tasks viewmodel (family by projectId)
// ---------------------------------------------------------------------------

final boardTasksProvider = AsyncNotifierProvider.family<BoardTasksViewModel,
    List<TaskEntity>, String>(
  BoardTasksViewModel.new,
);

class BoardTasksViewModel
    extends FamilyAsyncNotifier<List<TaskEntity>, String> {
  late final TaskService _service;

  @override
  Future<List<TaskEntity>> build(String arg) async {
    _service = ref.watch(taskServiceProvider);
    return _service.getTasksByProject(arg);
  }

  Future<void> loadTasks() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _service.getTasksByProject(arg));
  }

  Future<void> createTask({
    required String title,
    String? description,
    TaskPriority priority = TaskPriority.medium,
    TaskStatus status = TaskStatus.todo,
  }) async {
    try {
      final task = await _service.createTask(
        title: title,
        description: description,
        projectId: arg,
        priority: priority,
        status: status,
      );

      final current = state.valueOrNull ?? [];
      state = AsyncData([...current, task]);
    } catch (e) {
      state = AsyncError(e.toString(), StackTrace.current);
    }
  }

  Future<void> moveTask({
    required String taskId,
    required TaskStatus newStatus,
    required int newOrder,
  }) async {
    // Optimistic update
    final previous = state.valueOrNull ?? [];
    final updatedTasks = previous.map((t) {
      if (t.id == taskId) {
        return t.copyWith(status: newStatus, order: newOrder);
      }
      return t;
    }).toList();
    state = AsyncData(updatedTasks);

    try {
      await _service.moveTask(taskId, newStatus, newOrder);
    } catch (_) {
      // Revert on failure
      state = AsyncData(previous);
    }
  }

  Future<void> deleteTask(String taskId) async {
    final previous = state.valueOrNull ?? [];
    state = AsyncData(previous.where((t) => t.id != taskId).toList());

    try {
      await _service.deleteTask(taskId);
    } catch (_) {
      // Revert on failure
      state = AsyncData(previous);
    }
  }
}

// ---------------------------------------------------------------------------
// Stream provider for real-time updates
// ---------------------------------------------------------------------------

final taskStreamProvider =
    StreamProvider.family<List<TaskEntity>, String>((ref, projectId) {
  final service = ref.watch(taskServiceProvider);
  return service.watchTasksByProject(projectId);
});

// ---------------------------------------------------------------------------
// Filtered task providers
// ---------------------------------------------------------------------------

final todoTasksProvider =
    Provider.family<List<TaskEntity>, String>((ref, projectId) {
  final tasks = ref.watch(boardTasksProvider(projectId)).valueOrNull ?? [];
  return tasks.where((t) => t.status == TaskStatus.todo).toList()
    ..sort((a, b) => a.order.compareTo(b.order));
});

final inProgressTasksProvider =
    Provider.family<List<TaskEntity>, String>((ref, projectId) {
  final tasks = ref.watch(boardTasksProvider(projectId)).valueOrNull ?? [];
  return tasks.where((t) => t.status == TaskStatus.inProgress).toList()
    ..sort((a, b) => a.order.compareTo(b.order));
});

final inReviewTasksProvider =
    Provider.family<List<TaskEntity>, String>((ref, projectId) {
  final tasks = ref.watch(boardTasksProvider(projectId)).valueOrNull ?? [];
  return tasks.where((t) => t.status == TaskStatus.inReview).toList()
    ..sort((a, b) => a.order.compareTo(b.order));
});

final doneTasksProvider =
    Provider.family<List<TaskEntity>, String>((ref, projectId) {
  final tasks = ref.watch(boardTasksProvider(projectId)).valueOrNull ?? [];
  return tasks.where((t) => t.status == TaskStatus.done).toList()
    ..sort((a, b) => a.order.compareTo(b.order));
});
