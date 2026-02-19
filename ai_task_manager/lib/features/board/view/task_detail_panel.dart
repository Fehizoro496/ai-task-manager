import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/core/design_system/app_button.dart';
import 'package:ai_task_manager/core/design_system/app_toast.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/board/viewmodel/board_viewmodel.dart';
import 'package:ai_task_manager/features/tasks/model/task_entity.dart';
import 'package:ai_task_manager/features/tasks/viewmodel/task_viewmodel.dart';

/// Shows the task detail popup dialog.
void showTaskDetailDialog(
  BuildContext context, {
  required TaskEntity task,
  required String projectId,
}) {
  showDialog(
    context: context,
    barrierColor: Colors.black54,
    builder: (_) => TaskDetailDialog(task: task, projectId: projectId),
  );
}

String _formatDate(DateTime date) {
  final months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${months[date.month - 1]} ${date.day}, ${date.year}';
}

InputDecoration _inputDecoration({
  required String hint,
  required bool isDark,
  required Color hintColor,
  required Color borderColor,
}) {
  return InputDecoration(
    hintText: hint,
    hintStyle: TextStyle(color: hintColor, fontSize: 13),
    isDense: true,
    contentPadding: const EdgeInsets.symmetric(
      horizontal: AppSpacing.md,
      vertical: AppSpacing.md,
    ),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      borderSide: BorderSide(color: borderColor),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      borderSide: BorderSide(color: borderColor),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
    ),
  );
}

class TaskDetailDialog extends ConsumerStatefulWidget {
  const TaskDetailDialog({
    super.key,
    required this.task,
    required this.projectId,
  });

  final TaskEntity task;
  final String projectId;

  @override
  ConsumerState<TaskDetailDialog> createState() => _TaskDetailDialogState();
}

class _TaskDetailDialogState extends ConsumerState<TaskDetailDialog> {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _labelInputController;
  late TaskStatus _status;
  late TaskPriority _priority;
  late DateTime? _dueDate;
  late List<String> _labels;
  bool _isDirty = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.task.title);
    _descriptionController = TextEditingController(
      text: widget.task.description ?? '',
    );
    _labelInputController = TextEditingController();
    _status = widget.task.status;
    _priority = widget.task.priority;
    _dueDate = widget.task.dueDate;
    _labels = List.from(widget.task.labels);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _labelInputController.dispose();
    super.dispose();
  }

  void _close() {
    ref.read(selectedTaskProvider.notifier).state = null;
    Navigator.of(context).pop();
  }

  Future<void> _saveChanges() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) return;

    setState(() => _isSaving = true);

    try {
      // 1. Status → moveTask if changed
      if (_status != widget.task.status) {
        await ref
            .read(boardTasksProvider(widget.projectId).notifier)
            .moveTask(
              taskId: widget.task.id,
              newStatus: _status,
              newOrder: widget.task.order,
            );
      }

      // 2. All fields → updateTask
      final updated = TaskEntity(
        id: widget.task.id,
        title: title,
        description: _descriptionController.text.trim(),
        status: _status,
        priority: _priority,
        storyId: widget.task.storyId,
        projectId: widget.task.projectId,
        assigneeId: widget.task.assigneeId,
        labels: _labels,
        order: widget.task.order,
        dueDate: _dueDate,
        createdAt: widget.task.createdAt,
        updatedAt: DateTime.now(),
      );
      await ref
          .read(boardTasksProvider(widget.projectId).notifier)
          .updateTask(updated);

      ref.read(selectedTaskProvider.notifier).state = updated;
      setState(() {
        _isDirty = false;
        _isSaving = false;
      });
      if (!mounted) return;
      AppToast.success(context, 'Tâche mise à jour');
    } catch (_) {
      setState(() => _isSaving = false);
      if (!mounted) return;
      AppToast.error(context, 'Échec de la mise à jour');
    }
  }

  Future<void> _deleteTask() async {
    ref.read(selectedTaskProvider.notifier).state = null;
    Navigator.of(context).pop();
    await ref
        .read(boardTasksProvider(widget.projectId).notifier)
        .deleteTask(widget.task.id);
  }

  void _addLabel(String value) {
    final label = value.trim();
    if (label.isEmpty || _labels.contains(label)) return;
    setState(() {
      _labels.add(label);
      _isDirty = true;
    });
    _labelInputController.clear();
  }

  void _removeLabel(String label) {
    setState(() {
      _labels.remove(label);
      _isDirty = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark
        ? AppColors.surfaceDark
        : AppColors.surfaceLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final titleColor = isDark
        ? AppColors.textPrimaryDark
        : AppColors.textPrimaryLight;
    final labelColor = isDark
        ? AppColors.textSecondaryDark
        : AppColors.textSecondaryLight;
    final hintColor = isDark
        ? AppColors.textTertiaryDark
        : AppColors.textTertiaryLight;

    return Center(
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: 480,
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.85,
          ),
          decoration: BoxDecoration(
            color: surfaceColor,
            borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
            border: Border.all(color: borderColor),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.5 : 0.15),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.xl,
                  vertical: AppSpacing.lg,
                ),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: borderColor)),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(AppSpacing.radiusXl),
                  ),
                ),
                child: Row(
                  children: [
                    Text(
                      'Task Details',
                      style: TextStyle(
                        color: titleColor,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: _deleteTask,
                      icon: const Icon(Icons.delete_outline_rounded, size: 18),
                      color: AppColors.error.withOpacity(0.7),
                      tooltip: 'Delete task',
                      splashRadius: 18,
                    ),
                    IconButton(
                      onPressed: _close,
                      icon: const Icon(Icons.close_rounded, size: 18),
                      color: labelColor,
                      tooltip: 'Close',
                      splashRadius: 18,
                    ),
                  ],
                ),
              ),

              // Body
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SectionLabel(label: 'Title', color: labelColor),
                      const SizedBox(height: AppSpacing.xs),
                      TextField(
                        controller: _titleController,
                        style: TextStyle(
                          color: titleColor,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                        decoration: _inputDecoration(
                          hint: 'Task title',
                          isDark: isDark,
                          hintColor: hintColor,
                          borderColor: borderColor,
                        ),
                        onChanged: (_) => setState(() => _isDirty = true),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      _SectionLabel(label: 'Description', color: labelColor),
                      const SizedBox(height: AppSpacing.xs),
                      TextField(
                        controller: _descriptionController,
                        style: TextStyle(color: titleColor, fontSize: 13),
                        maxLines: 5,
                        minLines: 3,
                        decoration: _inputDecoration(
                          hint: 'Add a description...',
                          isDark: isDark,
                          hintColor: hintColor,
                          borderColor: borderColor,
                        ),
                        onChanged: (_) => setState(() => _isDirty = true),
                      ),
                      const SizedBox(height: AppSpacing.xl),

                      // Status & Priority side by side
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _SectionLabel(
                                  label: 'Status',
                                  color: labelColor,
                                ),
                                const SizedBox(height: AppSpacing.xs),
                                _StatusDropdown(
                                  value: _status,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  titleColor: titleColor,
                                  onChanged: (status) {
                                    if (status != null) {
                                      setState(() {
                                        _status = status;
                                        _isDirty = true;
                                      });
                                    }
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: AppSpacing.lg),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _SectionLabel(
                                  label: 'Priority',
                                  color: labelColor,
                                ),
                                const SizedBox(height: AppSpacing.xs),
                                _PriorityDropdown(
                                  value: _priority,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  titleColor: titleColor,
                                  onChanged: (priority) {
                                    if (priority != null) {
                                      setState(() {
                                        _priority = priority;
                                        _isDirty = true;
                                      });
                                    }
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xl),

                      _SectionLabel(label: 'Assignee', color: labelColor),
                      const SizedBox(height: AppSpacing.xs),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                          vertical: AppSpacing.md,
                        ),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(
                            AppSpacing.radiusMd,
                          ),
                          border: Border.all(color: borderColor),
                        ),
                        child: Text(
                          widget.task.assigneeId ?? 'Unassigned',
                          style: TextStyle(
                            color: widget.task.assigneeId != null
                                ? titleColor
                                : hintColor,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),

                      _SectionLabel(label: 'Labels', color: labelColor),
                      const SizedBox(height: AppSpacing.xs),
                      if (_labels.isNotEmpty)
                        Wrap(
                          spacing: AppSpacing.xs,
                          runSpacing: AppSpacing.xs,
                          children: _labels
                              .map(
                                (label) => Chip(
                                  label: Text(
                                    label,
                                    style: TextStyle(
                                      color: labelColor,
                                      fontSize: 12,
                                    ),
                                  ),
                                  deleteIcon: Icon(
                                    Icons.close,
                                    size: 14,
                                    color: hintColor,
                                  ),
                                  onDeleted: () => _removeLabel(label),
                                  backgroundColor: isDark
                                      ? AppColors.surfaceDark
                                      : AppColors.hoverLight,
                                  side: BorderSide(color: borderColor),
                                  visualDensity: VisualDensity.compact,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: AppSpacing.xs,
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      const SizedBox(height: AppSpacing.sm),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _labelInputController,
                              style: TextStyle(color: titleColor, fontSize: 13),
                              decoration: _inputDecoration(
                                hint: 'Add a label...',
                                isDark: isDark,
                                hintColor: hintColor,
                                borderColor: borderColor,
                              ),
                              onSubmitted: _addLabel,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          IconButton(
                            onPressed: () =>
                                _addLabel(_labelInputController.text),
                            icon: const Icon(Icons.add_rounded, size: 18),
                            color: AppColors.primary,
                            tooltip: 'Add label',
                            splashRadius: 18,
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xl),

                      _SectionLabel(label: 'Due Date', color: labelColor),
                      const SizedBox(height: AppSpacing.xs),
                      GestureDetector(
                        onTap: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _dueDate ?? DateTime.now(),
                            firstDate: DateTime.now().subtract(
                              const Duration(days: 365),
                            ),
                            lastDate: DateTime.now().add(
                              const Duration(days: 365 * 3),
                            ),
                          );
                          if (date != null) {
                            setState(() {
                              _dueDate = date;
                              _isDirty = true;
                            });
                          }
                        },
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.md,
                            vertical: AppSpacing.md,
                          ),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(
                              AppSpacing.radiusMd,
                            ),
                            border: Border.all(color: borderColor),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.calendar_today_rounded,
                                size: 14,
                                color: hintColor,
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Text(
                                  _dueDate != null
                                      ? _formatDate(_dueDate!)
                                      : 'No due date',
                                  style: TextStyle(
                                    color: _dueDate != null
                                        ? titleColor
                                        : hintColor,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                              if (_dueDate != null)
                                GestureDetector(
                                  onTap: () => setState(() {
                                    _dueDate = null;
                                    _isDirty = true;
                                  }),
                                  child: Icon(
                                    Icons.close_rounded,
                                    size: 14,
                                    color: hintColor,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: AppSpacing.xxxl),
                      Text(
                        'Created ${_formatDate(widget.task.createdAt)}',
                        style: TextStyle(color: hintColor, fontSize: 11),
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        'Updated ${_formatDate(widget.task.updatedAt)}',
                        style: TextStyle(color: hintColor, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ),

              // Footer — save button (visible only when dirty)
              if (_isDirty) ...[
                Divider(color: borderColor, height: 1),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: SizedBox(
                    width: double.infinity,
                    child: AppButton(
                      label: 'Enregistrer',
                      isLoading: _isSaving,
                      onPressed: _isSaving ? null : _saveChanges,
                      size: AppButtonSize.lg,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label, required this.color});
  final String label;
  final Color color;
  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: TextStyle(
        color: color,
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
      ),
    );
  }
}

class _StatusDropdown extends StatelessWidget {
  const _StatusDropdown({
    required this.value,
    required this.isDark,
    required this.borderColor,
    required this.titleColor,
    required this.onChanged,
  });
  final TaskStatus value;
  final bool isDark;
  final Color borderColor;
  final Color titleColor;
  final ValueChanged<TaskStatus?> onChanged;

  Color _colorForStatus(TaskStatus status) => switch (status) {
    TaskStatus.todo => AppColors.kanbanTodo,
    TaskStatus.inProgress => AppColors.kanbanInProgress,
    TaskStatus.inReview => AppColors.kanbanReview,
    TaskStatus.done => AppColors.kanbanDone,
  };

  String _labelForStatus(TaskStatus status) => switch (status) {
    TaskStatus.todo => 'To Do',
    TaskStatus.inProgress => 'In Progress',
    TaskStatus.inReview => 'In Review',
    TaskStatus.done => 'Done',
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: borderColor),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<TaskStatus>(
          value: value,
          isExpanded: true,
          icon: Icon(
            Icons.expand_more_rounded,
            size: 18,
            color: isDark
                ? AppColors.textTertiaryDark
                : AppColors.textTertiaryLight,
          ),
          items: TaskStatus.values
              .map(
                (status) => DropdownMenuItem(
                  value: status,
                  child: Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _colorForStatus(status),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        _labelForStatus(status),
                        style: TextStyle(color: titleColor, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

class _PriorityDropdown extends StatelessWidget {
  const _PriorityDropdown({
    required this.value,
    required this.isDark,
    required this.borderColor,
    required this.titleColor,
    required this.onChanged,
  });
  final TaskPriority value;
  final bool isDark;
  final Color borderColor;
  final Color titleColor;
  final ValueChanged<TaskPriority?> onChanged;

  Color _colorForPriority(TaskPriority p) => switch (p) {
    TaskPriority.urgent => AppColors.priorityUrgent,
    TaskPriority.high => AppColors.priorityHigh,
    TaskPriority.medium => AppColors.priorityMedium,
    TaskPriority.low => AppColors.priorityLow,
  };

  String _labelForPriority(TaskPriority p) => switch (p) {
    TaskPriority.urgent => 'Urgent',
    TaskPriority.high => 'High',
    TaskPriority.medium => 'Medium',
    TaskPriority.low => 'Low',
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: borderColor),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<TaskPriority>(
          value: value,
          isExpanded: true,
          icon: Icon(
            Icons.expand_more_rounded,
            size: 18,
            color: isDark
                ? AppColors.textTertiaryDark
                : AppColors.textTertiaryLight,
          ),
          items: TaskPriority.values
              .map(
                (p) => DropdownMenuItem(
                  value: p,
                  child: Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _colorForPriority(p),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        _labelForPriority(p),
                        style: TextStyle(color: titleColor, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
