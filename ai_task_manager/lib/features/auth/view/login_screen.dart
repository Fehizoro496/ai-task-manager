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

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  static const String routeName = '/login';

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onLogin() {
    if (!_formKey.currentState!.validate()) return;
    ref.read(authStateProvider.notifier).login(
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
        // App icon with glow
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
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _onLogin(),
              suffixIcon: _VisibilityToggle(
                obscure: _obscurePassword,
                isDark: isDark,
                onTap: () =>
                    setState(() => _obscurePassword = !_obscurePassword),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Password is required';
                if (v.length < 6) {
                  return 'Password must be at least 6 characters';
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
                label: 'Sign In',
                onPressed: isLoading ? null : _onLogin,
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
              prefix: "Don't have an account?  ",
              linkText: 'Create account',
              isDark: isDark,
              onTap: () => context.go('/register'),
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
              border:
                  Border.all(color: AppColors.warning.withOpacity(0.28)),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline_rounded,
                    color: AppColors.warning, size: 14),
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
          AppButton(
            label: 'Try another account',
            onPressed: () =>
                ref.read(authStateProvider.notifier).clearError(),
            variant: AppButtonVariant.secondary,
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

// ── Visibility toggle ─────────────────────────────────────────────────────────

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
            obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
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
