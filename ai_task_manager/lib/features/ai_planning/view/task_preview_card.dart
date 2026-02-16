import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/ai_planning/model/ai_draft_entity.dart';

class TaskPreviewCard extends StatelessWidget {
  const TaskPreviewCard({
    super.key,
    required this.task,
  });

  final AiTaskDraft task;

  Color get _priorityColor {
    switch (task.priority.toLowerCase()) {
      case 'urgent':
        return AppColors.priorityUrgent;
      case 'high':
        return AppColors.priorityHigh;
      case 'medium':
        return AppColors.priorityMedium;
      case 'low':
        return AppColors.priorityLow;
      default:
        return AppColors.priorityMedium;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxs),
      child: Row(
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: _priorityColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              task.title,
              style: TextStyle(
                color: textPrimary,
                fontSize: 12,
                fontWeight: FontWeight.w400,
                height: 1.4,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.xs + 2,
              vertical: 1,
            ),
            decoration: BoxDecoration(
              color: _priorityColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Text(
              task.priority,
              style: TextStyle(
                color: _priorityColor,
                fontSize: 9,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
