import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/core/design_system/app_button.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/tasks/model/task_entity.dart';
import 'package:ai_task_manager/features/tasks/viewmodel/task_viewmodel.dart';

class AddTaskInline extends ConsumerStatefulWidget {
  const AddTaskInline({
    super.key,
    required this.projectId,
    required this.status,
    required this.onClose,
  });

  final String projectId;
  final TaskStatus status;
  final VoidCallback onClose;

  @override
  ConsumerState<AddTaskInline> createState() => _AddTaskInlineState();
}

class _AddTaskInlineState extends ConsumerState<AddTaskInline> {
  final _titleController = TextEditingController();
  final _focusNode = FocusNode();
  TaskPriority _selectedPriority = TaskPriority.medium;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _focusNode.requestFocus();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final title = _titleController.text.trim();
    if (title.isEmpty || _isSubmitting) return;

    setState(() => _isSubmitting = true);

    await ref.read(boardTasksProvider(widget.projectId).notifier).createTask(
          title: title,
          priority: _selectedPriority,
          status: widget.status,
        );

    if (mounted) {
      _titleController.clear();
      _focusNode.requestFocus();
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.cardDark : AppColors.cardLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final titleColor =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final hintColor =
        isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;

    return Container(
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _titleController,
            focusNode: _focusNode,
            style: TextStyle(color: titleColor, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Task title...',
              hintStyle: TextStyle(color: hintColor, fontSize: 13),
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
                vertical: AppSpacing.sm,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                borderSide: BorderSide(color: borderColor),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                borderSide: BorderSide(color: borderColor),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                borderSide:
                    const BorderSide(color: AppColors.primary, width: 1.5),
              ),
            ),
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              _PriorityDropdown(
                value: _selectedPriority,
                isDark: isDark,
                onChanged: (priority) {
                  if (priority != null) {
                    setState(() => _selectedPriority = priority);
                  }
                },
              ),
              const Spacer(),
              AppButton(
                label: 'Cancel',
                onPressed: widget.onClose,
                variant: AppButtonVariant.ghost,
                size: AppButtonSize.sm,
              ),
              const SizedBox(width: AppSpacing.xs),
              AppButton(
                label: 'Add',
                onPressed: _isSubmitting ? null : _submit,
                isLoading: _isSubmitting,
                variant: AppButtonVariant.primary,
                size: AppButtonSize.sm,
              ),
            ],
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: const Duration(milliseconds: 200))
        .slideY(
          begin: -0.1,
          end: 0,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
        );
  }
}

// =============================================================================
// Priority Dropdown
// =============================================================================

class _PriorityDropdown extends StatelessWidget {
  const _PriorityDropdown({
    required this.value,
    required this.isDark,
    required this.onChanged,
  });

  final TaskPriority value;
  final bool isDark;
  final ValueChanged<TaskPriority?> onChanged;

  Color _colorForPriority(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.urgent:
        return AppColors.priorityUrgent;
      case TaskPriority.high:
        return AppColors.priorityHigh;
      case TaskPriority.medium:
        return AppColors.priorityMedium;
      case TaskPriority.low:
        return AppColors.priorityLow;
    }
  }

  String _labelForPriority(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.urgent:
        return 'Urgent';
      case TaskPriority.high:
        return 'High';
      case TaskPriority.medium:
        return 'Medium';
      case TaskPriority.low:
        return 'Low';
    }
  }

  @override
  Widget build(BuildContext context) {
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    return Container(
      height: 28,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        border: Border.all(color: borderColor),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<TaskPriority>(
          value: value,
          isDense: true,
          icon: Icon(
            Icons.expand_more_rounded,
            size: 16,
            color:
                isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
          ),
          items: TaskPriority.values.map((priority) {
            return DropdownMenuItem(
              value: priority,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _colorForPriority(priority),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    _labelForPriority(priority),
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
