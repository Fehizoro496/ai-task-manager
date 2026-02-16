import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/features/board/model/board_column_entity.dart';
import 'package:ai_task_manager/features/tasks/model/task_entity.dart';

// ---------------------------------------------------------------------------
// Board columns (static definition of the 4 kanban columns)
// ---------------------------------------------------------------------------

final boardColumnsProvider = Provider<List<BoardColumnEntity>>((ref) {
  return const [
    BoardColumnEntity(
      id: 'col-todo',
      title: 'To Do',
      status: TaskStatus.todo,
      color: AppColors.kanbanTodo,
    ),
    BoardColumnEntity(
      id: 'col-in-progress',
      title: 'In Progress',
      status: TaskStatus.inProgress,
      color: AppColors.kanbanInProgress,
    ),
    BoardColumnEntity(
      id: 'col-in-review',
      title: 'In Review',
      status: TaskStatus.inReview,
      color: AppColors.kanbanReview,
    ),
    BoardColumnEntity(
      id: 'col-done',
      title: 'Done',
      status: TaskStatus.done,
      color: AppColors.kanbanDone,
    ),
  ];
});

// ---------------------------------------------------------------------------
// Selected task (for detail panel)
// ---------------------------------------------------------------------------

final selectedTaskProvider = StateProvider<TaskEntity?>((ref) {
  return null;
});
