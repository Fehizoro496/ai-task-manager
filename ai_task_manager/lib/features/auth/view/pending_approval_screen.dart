import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';

import 'package:ai_task_manager/core/design_system/app_button.dart';
import 'package:ai_task_manager/core/design_system/app_card.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';

class PendingApprovalScreen extends StatelessWidget {
  const PendingApprovalScreen({super.key});

  static const String routeName = '/pending-approval';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: Center(
        child: SingleChildScrollView(
          padding: AppSpacing.paddingXxl,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildIcon(isDark)
                    .animate()
                    .fadeIn(duration: 500.ms, curve: Curves.easeOut)
                    .scale(
                      begin: const Offset(0.8, 0.8),
                      end: const Offset(1, 1),
                      duration: 500.ms,
                      curve: Curves.easeOut,
                    ),
                const SizedBox(height: AppSpacing.xxxl),
                AppCard(
                  padding: const EdgeInsets.all(AppSpacing.xxl),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Account Pending Approval',
                        textAlign: TextAlign.center,
                        style:
                            Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  color: isDark
                                      ? AppColors.textPrimaryDark
                                      : AppColors.textPrimaryLight,
                                  fontWeight: FontWeight.w700,
                                ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Text(
                        'Your account has been created and is awaiting admin approval. '
                        'You will be able to sign in once an administrator has reviewed and approved your request.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: isDark
                                  ? AppColors.textSecondaryDark
                                  : AppColors.textSecondaryLight,
                              height: 1.6,
                            ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      _buildInfoRow(
                        context,
                        isDark,
                        Icons.check_circle_outline_rounded,
                        AppColors.success,
                        'Account created successfully',
                      ),
                      const SizedBox(height: AppSpacing.md),
                      _buildInfoRow(
                        context,
                        isDark,
                        Icons.hourglass_top_rounded,
                        AppColors.warning,
                        'Waiting for admin review',
                      ),
                      const SizedBox(height: AppSpacing.xxl),
                      AppButton(
                        label: 'Back to Sign In',
                        onPressed: () => context.go('/login'),
                        size: AppButtonSize.lg,
                      ),
                    ],
                  ),
                )
                    .animate()
                    .fadeIn(
                      delay: 200.ms,
                      duration: 500.ms,
                      curve: Curves.easeOut,
                    )
                    .slideY(
                      begin: 0.05,
                      end: 0,
                      delay: 200.ms,
                      duration: 500.ms,
                      curve: Curves.easeOut,
                    ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIcon(bool isDark) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: AppColors.warning.withOpacity(0.15),
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        border: Border.all(
          color: AppColors.warning.withOpacity(0.3),
          width: 1.5,
        ),
      ),
      child: const Icon(
        Icons.hourglass_empty_rounded,
        color: AppColors.warning,
        size: 40,
      ),
    );
  }

  Widget _buildInfoRow(
    BuildContext context,
    bool isDark,
    IconData icon,
    Color color,
    String text,
  ) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: AppSpacing.sm),
        Text(
          text,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight,
                fontWeight: FontWeight.w500,
              ),
        ),
      ],
    );
  }
}
