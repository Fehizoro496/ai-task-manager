import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';

class KanbanColumn extends StatelessWidget {
  const KanbanColumn({
    super.key,
    required this.title,
    required this.color,
    required this.taskCount,
    this.children = const [],
    this.onAddTask,
  });

  final String title;
  final Color color;
  final int taskCount;
  final List<Widget> children;
  final VoidCallback? onAddTask;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final backgroundColor =
        isDark ? AppColors.surfaceDark : AppColors.backgroundLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final titleColor =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final countColor =
        isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;

    return Container(
      width: AppConstants.kanbanColumnWidth,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: borderColor, width: 1.0),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            child: Row(
              children: [
                // Colored dot
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                // Title
                Text(
                  title,
                  style: TextStyle(
                    color: titleColor,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.1,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                // Count badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: AppSpacing.xxs,
                  ),
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.hoverDark
                        : AppColors.hoverLight,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                  ),
                  child: Text(
                    '$taskCount',
                    style: TextStyle(
                      color: countColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Spacer(),
                // Add button
                if (onAddTask != null) _AddButton(onTap: onAddTask!),
              ],
            ),
          ),
          Divider(
            height: 1,
            color: isDark ? AppColors.dividerDark : AppColors.dividerLight,
          ),
          // Scrollable body
          Expanded(
            child: children.isEmpty
                ? _EmptyColumnBody(isDark: isDark)
                : ListView.separated(
                    padding: const EdgeInsets.all(AppSpacing.sm),
                    itemCount: children.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AppSpacing.sm),
                    itemBuilder: (_, index) => children[index],
                  ),
          ),
        ],
      ),
    );
  }
}

class _AddButton extends StatefulWidget {
  const _AddButton({required this.onTap});

  final VoidCallback onTap;

  @override
  State<_AddButton> createState() => _AddButtonState();
}

class _AddButtonState extends State<_AddButton> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: AppConstants.animationDuration,
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: _isHovered
                ? (isDark ? AppColors.hoverDark : AppColors.hoverLight)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          ),
          child: Icon(
            Icons.add_rounded,
            size: 18,
            color: isDark
                ? AppColors.textSecondaryDark
                : AppColors.textSecondaryLight,
          ),
        ),
      ),
    );
  }
}

class _EmptyColumnBody extends StatelessWidget {
  const _EmptyColumnBody({required this.isDark});

  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: AppSpacing.paddingXl,
        child: Text(
          'No tasks yet',
          style: TextStyle(
            color: isDark
                ? AppColors.textTertiaryDark
                : AppColors.textTertiaryLight,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
