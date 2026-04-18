import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';

import 'package:ai_task_manager/core/design_system/app_button.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/auth/view/widgets/auth_layout.dart';

class PendingApprovalScreen extends StatelessWidget {
  const PendingApprovalScreen({super.key});

  static const String routeName = '/pending-approval';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final titleColor = isDark ? Colors.white : const Color(0xFF1D1D1F);
    final bodyColor = isDark
        ? Colors.white.withOpacity(0.55)
        : Colors.black.withOpacity(0.50);
    final itemColor = isDark
        ? Colors.white.withOpacity(0.60)
        : Colors.black.withOpacity(0.55);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AuthBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.xxl,
              vertical: AppSpacing.xxxxl,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Icon with glow
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.warning.withOpacity(0.14),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.warning.withOpacity(0.32),
                          blurRadius: 32,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.hourglass_empty_rounded,
                      color: AppColors.warning,
                      size: 38,
                    ),
                  )
                      .animate()
                      .fadeIn(duration: 500.ms, curve: Curves.easeOut)
                      .scale(
                        begin: const Offset(0.8, 0.8),
                        end: const Offset(1, 1),
                        duration: 500.ms,
                        curve: Curves.easeOut,
                      ),
                  const SizedBox(height: AppSpacing.xxxl),
                  AuthGlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Account Pending',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: titleColor,
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            letterSpacing: -0.40,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Approval Required',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: AppColors.warning,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            letterSpacing: -0.15,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        Text(
                          'Your account has been created and is awaiting admin approval. '
                          'You will be able to sign in once an administrator has reviewed your request.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: bodyColor,
                            fontSize: 13,
                            letterSpacing: -0.12,
                            height: 1.55,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xl),
                        // Status items
                        _StatusItem(
                          icon: Icons.check_circle_outline_rounded,
                          color: AppColors.success,
                          label: 'Account created successfully',
                          textColor: itemColor,
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        _StatusItem(
                          icon: Icons.hourglass_top_rounded,
                          color: AppColors.warning,
                          label: 'Waiting for admin review',
                          textColor: itemColor,
                        ),
                        const SizedBox(height: AppSpacing.xl),
                        AppButton(
                          label: 'Back to Sign In',
                          onPressed: () => context.go('/login'),
                          variant: AppButtonVariant.primary,
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
      ),
    );
  }
}

class _StatusItem extends StatelessWidget {
  const _StatusItem({
    required this.icon,
    required this.color,
    required this.label,
    required this.textColor,
  });

  final IconData icon;
  final Color color;
  final String label;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 15),
        const SizedBox(width: AppSpacing.sm),
        Text(
          label,
          style: TextStyle(
            color: textColor,
            fontSize: 13,
            letterSpacing: -0.12,
          ),
        ),
      ],
    );
  }
}
