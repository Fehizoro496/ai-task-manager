import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/design_system/app_button.dart';

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String description;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final titleColor =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final descriptionColor =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final iconColor =
        isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;
    final iconBgColor = isDark ? AppColors.surfaceDark : AppColors.hoverLight;

    return Center(
      child: Padding(
        padding: AppSpacing.paddingXxl,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon container
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: iconBgColor,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 32,
                color: iconColor,
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),
            // Title
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: titleColor,
                fontSize: 16,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.1,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            // Description
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 320),
              child: Text(
                description,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: descriptionColor,
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ),
            // Action button
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: AppSpacing.xxl),
              AppButton(
                label: actionLabel!,
                onPressed: onAction,
                variant: AppButtonVariant.primary,
                size: AppButtonSize.md,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
