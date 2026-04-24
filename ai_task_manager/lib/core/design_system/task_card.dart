import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/theme/app_theme.dart';
import 'package:ai_task_manager/core/utils/constants.dart';
import 'package:ai_task_manager/shared/user_avatar.dart';

enum TaskPriority { urgent, high, medium, low }

class TaskCard extends StatefulWidget {
  const TaskCard({
    super.key,
    required this.title,
    this.identifier,
    this.description,
    this.priority = TaskPriority.medium,
    this.assigneeName,
    this.assigneeAvatar,
    this.labels = const [],
    this.dueDate,
    this.onTap,
  });

  final String title;

  /// Identifiant lisible de la tâche, ex : "AM-001"
  final String? identifier;
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
    final cardColor = isDark ? AppColors.cardDark : AppColors.surfaceLight;
    final titleColor = isDark
        ? AppColors.textPrimaryDark
        : AppColors.textPrimaryLight;
    final subtitleColor = isDark
        ? AppColors.textSecondaryDark
        : AppColors.textSecondaryLight;
    final tertiaryColor = isDark
        ? AppColors.textTertiaryDark
        : AppColors.textTertiaryLight;

    // Apple shadow: soft, wide, barely visible at rest; more pronounced on hover
    final shadows = _isHovered
        ? [
            BoxShadow(
              color: isDark
                  ? Colors.black.withOpacity(0.40)
                  : Colors.black.withOpacity(0.14),
              blurRadius: 30,
              offset: const Offset(0, 8),
            ),
          ]
        : AppTheme.cardShadow(isDark);

    return MouseRegion(
      cursor: widget.onTap != null
          ? SystemMouseCursors.click
          : MouseCursor.defer,
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
            child: AnimatedContainer(
              duration: AppConstants.animationDuration,
              curve: Curves.easeOut,
              constraints: const BoxConstraints(
                minHeight: AppConstants.taskCardMinHeight,
              ),
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.white.withOpacity(_isHovered ? 0.11 : 0.08)
                    : Colors.white.withOpacity(_isHovered ? 0.92 : 0.78),
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                border: Border.all(
                  color: isDark
                      ? Colors.white.withOpacity(0.10)
                      : Colors.white.withOpacity(0.88),
                  width: 1,
                ),
                boxShadow: shadows,
              ),
              child: IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Priority accent bar — thin, refined
                    Container(
                      width: 3,
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
                            // Identifier + Priority badge row
                            Row(
                              children: [
                                if (widget.identifier != null) ...[
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AppSpacing.sm,
                                      vertical: AppSpacing.xxs,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isDark
                                          ? AppColors.surfaceDark
                                          : AppColors.hoverLight,
                                      borderRadius: BorderRadius.circular(
                                        AppSpacing.radiusSm,
                                      ),
                                      border: Border.all(
                                        color: isDark
                                            ? AppColors.borderDark
                                            : AppColors.borderLight,
                                        width: 0.8,
                                      ),
                                    ),
                                    child: Text(
                                      widget.identifier!,
                                      style: TextStyle(
                                        color: isDark
                                            ? AppColors.textTertiaryDark
                                            : AppColors.textTertiaryLight,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                        letterSpacing: 0.4,
                                        fontFamily: 'monospace',
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: AppSpacing.xs),
                                ],
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: AppSpacing.sm,
                                    vertical: AppSpacing.xxs,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _priorityColor.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(
                                      AppSpacing.radiusSm,
                                    ),
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
                                letterSpacing: -0.15,
                                height: 1.30,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            // Description
                            if (widget.description != null &&
                                widget.description!.isNotEmpty) ...[
                              const SizedBox(height: AppSpacing.xs),
                              Text(
                                widget.description!,
                                style: TextStyle(
                                  color: subtitleColor,
                                  fontSize: 12,
                                  letterSpacing: -0.12,
                                  height: 1.40,
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
                                children: widget.labels
                                    .map(
                                      (label) => Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: isDark
                                              ? AppColors.hoverDark
                                              : AppColors.backgroundLight,
                                          borderRadius: BorderRadius.circular(
                                            AppSpacing.radiusSm,
                                          ),
                                        ),
                                        child: Text(
                                          label,
                                          style: TextStyle(
                                            color: tertiaryColor,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w500,
                                            letterSpacing: -0.05,
                                          ),
                                        ),
                                      ),
                                    )
                                    .toList(),
                              ),
                            ],
                            // Footer: due date + assignee
                            if (widget.dueDate != null ||
                                widget.assigneeName != null) ...[
                              const SizedBox(height: AppSpacing.sm),
                              Row(
                                children: [
                                  if (widget.dueDate != null) ...[
                                    Icon(
                                      _isOverdue
                                          ? Icons.warning_amber_rounded
                                          : Icons.calendar_today_rounded,
                                      size: 10,
                                      color: _isOverdue
                                          ? AppColors.error
                                          : tertiaryColor,
                                    ),
                                    const SizedBox(width: 3),
                                    Text(
                                      _formatDate(widget.dueDate!),
                                      style: TextStyle(
                                        color: _isOverdue
                                            ? AppColors.error
                                            : tertiaryColor,
                                        fontSize: 11,
                                        letterSpacing: -0.08,
                                        fontWeight: _isOverdue
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                      ),
                                    ),
                                  ],
                                  const Spacer(),
                                  if (widget.assigneeName != null)
                                    Tooltip(
                                      message: widget.assigneeName!,
                                      preferBelow: false,
                                      decoration: BoxDecoration(
                                        color: isDark
                                            ? AppColors.surfaceDark
                                            : AppColors.textPrimaryLight,
                                        borderRadius: BorderRadius.circular(
                                          AppSpacing.radiusSm,
                                        ),
                                      ),
                                      textStyle: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 11,
                                      ),
                                      child: UserAvatar(
                                        name: widget.assigneeName!,
                                        avatarUrl: widget.assigneeAvatar,
                                        radius: 12,
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
        ),
      ),
    );
  }
}
