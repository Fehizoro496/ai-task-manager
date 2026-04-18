import 'dart:ui';

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

    final titleColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final countColor = isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;

    return ClipRRect(
      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
      width: AppConstants.kanbanColumnWidth,
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.07) : Colors.white.withOpacity(0.62),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.10) : Colors.white.withOpacity(0.80),
          width: 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Column header ────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            child: Row(
              children: [
                // Status dot
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  title,
                  style: TextStyle(
                    color: titleColor,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.15,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                // Count chip — minimal Apple style
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.hoverDark
                        : AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                    border: Border.all(
                      color: isDark ? Colors.white.withOpacity(0.10) : Colors.white.withOpacity(0.70),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    '$taskCount',
                    style: TextStyle(
                      color: countColor,
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      letterSpacing: -0.05,
                    ),
                  ),
                ),
                const Spacer(),
                if (onAddTask != null) _AddButton(onTap: onAddTask!),
              ],
            ),
          ),
          Divider(
            height: 1,
            color: isDark ? AppColors.dividerDark : AppColors.dividerLight,
          ),
          // ── Scrollable body ───────────────────────────────────────────────
          Expanded(
            child: children.isEmpty
                ? _EmptyBody(isDark: isDark)
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
        ),
      ),
    );
  }
}

// ── Add button ────────────────────────────────────────────────────────────────

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
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            color: _isHovered
                ? (isDark ? AppColors.hoverDark : AppColors.hoverLight)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          ),
          child: Icon(
            Icons.add_rounded,
            size: 16,
            color: _isHovered
                ? AppColors.primary
                : (isDark
                    ? AppColors.textTertiaryDark
                    : AppColors.textTertiaryLight),
          ),
        ),
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

class _EmptyBody extends StatelessWidget {
  const _EmptyBody({required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: AppSpacing.paddingXl,
        child: Text(
          'No tasks',
          style: TextStyle(
            color: isDark
                ? AppColors.textTertiaryDark
                : AppColors.textTertiaryLight,
            fontSize: 12,
            letterSpacing: -0.12,
          ),
        ),
      ),
    );
  }
}
