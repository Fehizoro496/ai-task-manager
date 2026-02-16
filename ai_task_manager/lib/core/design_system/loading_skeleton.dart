import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';

class ShimmerLoading extends StatefulWidget {
  const ShimmerLoading({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius,
  });

  final double width;
  final double height;
  final double? borderRadius;

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    _animation = Tween<double>(begin: -1.0, end: 2.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = isDark ? AppColors.surfaceDark : AppColors.hoverLight;
    final highlightColor =
        isDark ? AppColors.hoverDark : AppColors.surfaceLight;

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(
              widget.borderRadius ?? AppSpacing.radiusMd,
            ),
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [baseColor, highlightColor, baseColor],
              stops: [
                (_animation.value - 0.3).clamp(0.0, 1.0),
                _animation.value.clamp(0.0, 1.0),
                (_animation.value + 0.3).clamp(0.0, 1.0),
              ],
            ),
          ),
        );
      },
    );
  }
}

class TaskCardSkeleton extends StatelessWidget {
  const TaskCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.cardDark : AppColors.cardLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    return Container(
      constraints: const BoxConstraints(
        minHeight: AppConstants.taskCardMinHeight,
      ),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: borderColor, width: 1.0),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Priority indicator skeleton
          ShimmerLoading(
            width: 4,
            height: AppConstants.taskCardMinHeight,
            borderRadius: 0,
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Priority badge skeleton
                  const ShimmerLoading(
                    width: 52,
                    height: 18,
                    borderRadius: AppSpacing.radiusSm,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  // Title skeleton
                  const ShimmerLoading(
                    width: double.infinity,
                    height: 14,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  // Description skeleton
                  ShimmerLoading(
                    width: 180,
                    height: 12,
                    borderRadius: AppSpacing.radiusSm,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  // Labels skeleton
                  Row(
                    children: const [
                      ShimmerLoading(
                        width: 48,
                        height: 16,
                        borderRadius: AppSpacing.radiusSm,
                      ),
                      SizedBox(width: AppSpacing.xs),
                      ShimmerLoading(
                        width: 60,
                        height: 16,
                        borderRadius: AppSpacing.radiusSm,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class KanbanColumnSkeleton extends StatelessWidget {
  const KanbanColumnSkeleton({
    super.key,
    this.taskCount = 3,
  });

  final int taskCount;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final backgroundColor =
        isDark ? AppColors.surfaceDark : AppColors.backgroundLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;

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
          // Header skeleton
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            child: Row(
              children: const [
                ShimmerLoading(width: 10, height: 10, borderRadius: 5),
                SizedBox(width: AppSpacing.sm),
                ShimmerLoading(width: 80, height: 14),
                SizedBox(width: AppSpacing.sm),
                ShimmerLoading(
                  width: 24,
                  height: 18,
                  borderRadius: AppSpacing.radiusFull,
                ),
              ],
            ),
          ),
          Divider(
            height: 1,
            color: isDark ? AppColors.dividerDark : AppColors.dividerLight,
          ),
          // Task cards skeleton
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.sm),
              itemCount: taskCount,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: AppSpacing.sm),
              itemBuilder: (_, __) => const TaskCardSkeleton(),
            ),
          ),
        ],
      ),
    );
  }
}
