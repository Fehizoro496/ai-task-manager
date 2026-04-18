import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:ai_task_manager/core/design_system/app_button.dart';
import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';
import 'package:ai_task_manager/features/auth/view/widgets/auth_layout.dart';
import 'package:ai_task_manager/features/auth/view/widgets/google_sign_in_button.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  static const String routeName = '/register';

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _onRegister() {
    if (!_formKey.currentState!.validate()) return;
    ref.read(authStateProvider.notifier).register(
          _nameController.text.trim(),
          _emailController.text.trim(),
          _passwordController.text,
        );
  }

  void _onGoogleSignIn() {
    ref.read(authStateProvider.notifier).loginWithGoogle();
  }

  String? _extractErrorMessage(Object error) {
    if (error is ServerException) return error.message;
    if (error is AuthException) return error.message;
    if (error is CacheException) return error.message;
    return error.toString();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isLoading = authState is AsyncLoading;
    final isPending =
        authState is AsyncError && authState.error is PendingApprovalException;

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
                  _buildHeader(isDark),
                  const SizedBox(height: AppSpacing.xxl),
                  if (isPending)
                    _buildPendingCard(isDark)
                  else
                    _buildFormCard(isDark, isLoading, authState),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Header ─────────────────────────────────────────────────────────────────

  Widget _buildHeader(bool isDark) {
    final titleColor = isDark ? Colors.white : const Color(0xFF1D1D1F);
    final subtitleColor = isDark
        ? Colors.white.withOpacity(0.50)
        : Colors.black.withOpacity(0.42);

    return Column(
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
          'Create Account',
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
          'Get started with ${AppConstants.appName}',
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
        .slideY(begin: -0.08, end: 0, duration: 500.ms, curve: Curves.easeOut);
  }

  // ── Form card ───────────────────────────────────────────────────────────────

  Widget _buildFormCard(
      bool isDark, bool isLoading, AsyncValue<dynamic> authState) {
    return AuthGlassCard(
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AuthField(
              controller: _nameController,
              label: 'Full Name',
              hint: 'Your name',
              icon: Icons.person_outline_rounded,
              textCapitalization: TextCapitalization.words,
              isDark: isDark,
              textInputAction: TextInputAction.next,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Name is required';
                if (v.trim().length < 2) {
                  return 'Name must be at least 2 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),
            AuthField(
              controller: _emailController,
              label: 'Email',
              hint: 'you@example.com',
              icon: Icons.alternate_email_rounded,
              keyboardType: TextInputType.emailAddress,
              isDark: isDark,
              textInputAction: TextInputAction.next,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Email is required';
                if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                    .hasMatch(v.trim())) {
                  return 'Enter a valid email address';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),
            AuthField(
              controller: _passwordController,
              label: 'Password',
              hint: '••••••••',
              icon: Icons.lock_outline_rounded,
              obscureText: _obscurePassword,
              isDark: isDark,
              textInputAction: TextInputAction.next,
              suffixIcon: _VisibilityToggle(
                obscure: _obscurePassword,
                isDark: isDark,
                onTap: () =>
                    setState(() => _obscurePassword = !_obscurePassword),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Password is required';
                if (v.length < 8) {
                  return 'Password must be at least 8 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),
            AuthField(
              controller: _confirmPasswordController,
              label: 'Confirm Password',
              hint: '••••••••',
              icon: Icons.lock_outline_rounded,
              obscureText: _obscureConfirmPassword,
              isDark: isDark,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _onRegister(),
              suffixIcon: _VisibilityToggle(
                obscure: _obscureConfirmPassword,
                isDark: isDark,
                onTap: () => setState(
                    () => _obscureConfirmPassword = !_obscureConfirmPassword),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) {
                  return 'Please confirm your password';
                }
                if (v != _passwordController.text) {
                  return 'Passwords do not match';
                }
                return null;
              },
            ),
            if (authState is AsyncError) ...[
              const SizedBox(height: AppSpacing.md),
              AuthErrorBanner(
                message: _extractErrorMessage(authState.error) ??
                    'An error occurred',
                isDark: isDark,
              ).animate().fadeIn(duration: 300.ms).shake(
                    hz: 3,
                    rotation: 0.008,
                    duration: 400.ms,
                  ),
            ],
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              height: 44,
              child: AppButton(
                label: 'Create Account',
                onPressed: isLoading ? null : _onRegister,
                isLoading: isLoading,
                size: AppButtonSize.lg,
                variant: AppButtonVariant.primary,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            AuthDivider(isDark: isDark),
            const SizedBox(height: AppSpacing.lg),
            GoogleSignInButton(
              onPressed: isLoading ? null : _onGoogleSignIn,
              isLoading: isLoading,
            ),
            const SizedBox(height: AppSpacing.xl),
            AuthFooterLink(
              prefix: 'Already have an account?  ',
              linkText: 'Sign in',
              isDark: isDark,
              onTap: () => context.go('/login'),
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(delay: 150.ms, duration: 500.ms, curve: Curves.easeOut)
        .slideY(
          begin: 0.06,
          end: 0,
          delay: 150.ms,
          duration: 500.ms,
          curve: Curves.easeOut,
        );
  }

  // ── Pending card ────────────────────────────────────────────────────────────

  Widget _buildPendingCard(bool isDark) {
    final titleColor = isDark ? Colors.white : const Color(0xFF1D1D1F);
    final bodyColor = isDark
        ? Colors.white.withOpacity(0.55)
        : Colors.black.withOpacity(0.50);
    final itemColor = isDark
        ? Colors.white.withOpacity(0.60)
        : Colors.black.withOpacity(0.55);

    return AuthGlassCard(
      child: Column(
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
            'Account Created',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: titleColor,
              fontSize: 20,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.36,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Pending Approval',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.warning,
              fontSize: 14,
              fontWeight: FontWeight.w500,
              letterSpacing: -0.15,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'An administrator will review and approve your request shortly.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: bodyColor,
              fontSize: 13,
              letterSpacing: -0.12,
              height: 1.5,
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
        .fadeIn(delay: 100.ms, duration: 400.ms, curve: Curves.easeOut)
        .slideY(
          begin: 0.05,
          end: 0,
          delay: 100.ms,
          duration: 400.ms,
          curve: Curves.easeOut,
        );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _VisibilityToggle extends StatelessWidget {
  const _VisibilityToggle({
    required this.obscure,
    required this.isDark,
    required this.onTap,
  });

  final bool obscure;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
          child: Icon(
            obscure
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
            size: 18,
            color: isDark
                ? Colors.white.withOpacity(0.38)
                : Colors.black.withOpacity(0.32),
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
