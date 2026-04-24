import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';
import 'package:ai_task_manager/features/auth/view/widgets/github_sign_in_button.dart';
import 'package:ai_task_manager/features/auth/view/widgets/auth_layout.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  static const String routeName = '/login';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isLoading = authState is AsyncLoading;
    final isPending =
        authState is AsyncError && authState.error is PendingApprovalException;

    final titleColor = isDark ? Colors.white : const Color(0xFF1D1D1F);
    final subtitleColor = isDark
        ? Colors.white.withOpacity(0.50)
        : Colors.black.withOpacity(0.42);

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
              constraints: const BoxConstraints(maxWidth: 380),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header
                  Column(
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.50),
                              blurRadius: 36,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.task_alt_rounded,
                          color: Colors.white,
                          size: 36,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      Text(
                        AppConstants.appName,
                        style: TextStyle(
                          color: titleColor,
                          fontSize: 30,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.60,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Sign in to continue',
                        style: TextStyle(
                          color: subtitleColor,
                          fontSize: 15,
                          fontWeight: FontWeight.w400,
                          letterSpacing: -0.20,
                        ),
                      ),
                    ],
                  )
                      .animate()
                      .fadeIn(duration: 500.ms, curve: Curves.easeOut)
                      .slideY(begin: -0.08, end: 0, duration: 500.ms, curve: Curves.easeOut),

                  const SizedBox(height: AppSpacing.xxl),

                  // Card
                  AuthGlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (isPending) ...[
                          _PendingContent(isDark: isDark, ref: ref),
                        ] else ...[
                          if (authState is AsyncError && !isPending) ...[
                            AuthErrorBanner(
                              message: _extractError(authState.error ?? 'An error occurred'),
                              isDark: isDark,
                            ).animate().fadeIn(duration: 300.ms).shake(
                                  hz: 3,
                                  rotation: 0.008,
                                  duration: 400.ms,
                                ),
                            const SizedBox(height: AppSpacing.lg),
                          ],
                          GithubSignInButton(
                            onPressed: isLoading
                                ? null
                                : () => ref.read(authStateProvider.notifier).loginWithGithub(),
                            isLoading: isLoading,
                          ),
                        ],
                      ],
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 150.ms, duration: 500.ms, curve: Curves.easeOut)
                      .slideY(begin: 0.06, end: 0, delay: 150.ms, duration: 500.ms, curve: Curves.easeOut),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  static String _extractError(Object error) {
    if (error is ServerException) return error.message;
    if (error is AuthException) return error.message;
    return error.toString();
  }
}

class _PendingContent extends StatelessWidget {
  const _PendingContent({required this.isDark, required this.ref});

  final bool isDark;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final titleColor = isDark ? Colors.white : const Color(0xFF1D1D1F);
    final bodyColor = isDark
        ? Colors.white.withOpacity(0.55)
        : Colors.black.withOpacity(0.50);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.warning.withOpacity(0.14),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.warning.withOpacity(0.28),
                  blurRadius: 24,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(
              Icons.hourglass_empty_rounded,
              color: AppColors.warning,
              size: 30,
            ),
          ).animate().scale(
                begin: const Offset(0.8, 0.8),
                duration: 400.ms,
                curve: Curves.easeOut,
              ),
        ),
        const SizedBox(height: AppSpacing.xl),
        Text(
          'Account Pending Approval',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: titleColor,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.32,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Your account is awaiting admin approval. '
          'You\'ll be notified once it\'s been reviewed.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: bodyColor,
            fontSize: 13,
            letterSpacing: -0.12,
            height: 1.5,
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          decoration: BoxDecoration(
            color: AppColors.warning.withOpacity(0.10),
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(color: AppColors.warning.withOpacity(0.28)),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline_rounded, color: AppColors.warning, size: 14),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text(
                  'Contact an administrator if this takes too long.',
                  style: TextStyle(
                    color: AppColors.warning,
                    fontSize: 12,
                    letterSpacing: -0.10,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        GithubSignInButton(
          onPressed: () => ref.read(authStateProvider.notifier).clearError(),
          isLoading: false,
          label: 'Try another account',
        ),
      ],
    );
  }
}
