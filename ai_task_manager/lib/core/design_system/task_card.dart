import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';
import 'package:ai_task_manager/shared/user_avatar.dart';

enum TaskPriority { urgent, high, medium, low }

class TaskCard extends StatefulWidget {
  const TaskCard({
    super.key,
    required this.title,
    this.description,
    this.priority = TaskPriority.medium,
    this.assigneeName,
    this.assigneeAvatar,
    this.labels = const [],
    this.dueDate,
    this.onTap,
  });

  final String title;
  final String? description;
  final TaskPriority priority;
  final String? assigneeName;
  final String? assigneeAvatar;
  final List<String> labels;
  final DateTime? dueDate;
  final VoidCallback? onTap;

  @override
  State<TaskCard> createState() => _TaskCardState();
}

class _TaskCardState extends State<TaskCard> {
  bool _isHovered = false;

  Color get _priorityColor {
    switch (widget.priority) {
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

  String get _priorityLabel {
    switch (widget.priority) {
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

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final d = DateTime(date.year, date.month, date.day);
    final diff = d.difference(today).inDays;

    if (diff == 0) return 'Today';
    if (diff == 1) return 'Tomorrow';
    if (diff == -1) return 'Yesterday';

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}';
  }

  bool get _isOverdue {
    if (widget.dueDate == null) return false;
    final now = DateTime.now();
    return widget.dueDate!.isBefore(DateTime(now.year, now.month, now.day));
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.cardDark : AppColors.cardLight;
    final borderColor = _isHovered
        ? (isDark ? AppColors.borderDark.withOpacity(0.8) : AppColors.primary.withOpacity(0.15))
        : (isDark ? AppColors.borderDark : AppColors.borderLight);
    final titleColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subtitleColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final tertiaryColor = isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;

    return MouseRegion(
      cursor: widget.onTap != null ? SystemMouseCursors.click : MouseCursor.defer,
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: AppConstants.animationDuration,
          curve: Curves.easeInOut,
          constraints: const BoxConstraints(
            minHeight: AppConstants.taskCardMinHeight,
          ),
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            border: Border.all(color: borderColor, width: 1.0),
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? Colors.black.withOpacity(_isHovered ? 0.25 : 0.12)
                    : Colors.black.withOpacity(_isHovered ? 0.07 : 0.02),
                blurRadius: _isHovered ? 10 : 4,
                offset: Offset(0, _isHovered ? 3 : 1),
              ),
            ],
          ),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Priority indicator bar
                Container(
                  width: 4,
                  decoration: BoxDecoration(
                    color: _priorityColor,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(AppSpacing.radiusLg),
                      bottomLeft: Radius.circular(AppSpacing.radiusLg),
                    ),
                  ),
                ),
                // Card content
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Priority badge row
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.sm,
                                vertical: AppSpacing.xxs,
                              ),
                              decoration: BoxDecoration(
                                color: _priorityColor.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                              ),
                              child: Text(
                                _priorityLabel,
                                style: TextStyle(
                                  color: _priorityColor,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.3,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        // Title
                        Text(
                          widget.title,
                          style: TextStyle(
                            color: titleColor,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            height: 1.3,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        // Description
                        if (widget.description != null && widget.description!.isNotEmpty) ...[
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            widget.description!,
                            style: TextStyle(
                              color: subtitleColor,
                              fontSize: 12,
                              height: 1.4,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        // Labels
                        if (widget.labels.isNotEmpty) ...[
                          const SizedBox(height: AppSpacing.sm),
                          Wrap(
                            spacing: AppSpacing.xs,
                            runSpacing: AppSpacing.xs,
                            children: widget.labels.map((label) {
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.sm,
                                  vertical: AppSpacing.xxs,
                                ),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? AppColors.surfaceDark
                                      : AppColors.hoverLight,
                                  borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                                ),
                                child: Text(
                                  label,
                                  style: TextStyle(
                                    color: tertiaryColor,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                        // Bottom row: due date + assignee avatar
                        if (widget.dueDate != null || widget.assigneeName != null) ...[
                          const SizedBox(height: AppSpacing.sm),
                          Row(
                            children: [
                              if (widget.dueDate != null) ...[
                                Icon(
                                  _isOverdue
                                      ? Icons.warning_amber_rounded
                                      : Icons.calendar_today_rounded,
                                  size: 11,
                                  color: _isOverdue ? AppColors.error : tertiaryColor,
                                ),
                                const SizedBox(width: AppSpacing.xxs + 2),
                                Text(
                                  _formatDate(widget.dueDate!),
                                  style: TextStyle(
                                    color: _isOverdue ? AppColors.error : tertiaryColor,
                                    fontSize: 11,
                                    fontWeight: _isOverdue ? FontWeight.w600 : FontWeight.w400,
                                  ),
                                ),
                              ],
                              const Spacer(),
                              if (widget.assigneeName != null)
                                Tooltip(
                                  message: widget.assigneeName!,
                                  preferBelow: false,
                                  decoration: BoxDecoration(
                                    color: isDark ? AppColors.surfaceDark : AppColors.textPrimaryLight,
                                    borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                                  ),
                                  textStyle: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: isDark ? AppColors.borderDark : AppColors.borderLight,
                                        width: 1.5,
                                      ),
                                    ),
                                    child: UserAvatar(
                                      name: widget.assigneeName!,
                                      avatarUrl: widget.assigneeAvatar,
                                      radius: 13,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

