import 'dart:ui';

import 'package:flutter/material.dart';

import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';

// ── Background ────────────────────────────────────────────────────────────────

/// Full-screen background with soft blurred color orbs.
class AuthBackground extends StatelessWidget {
  const AuthBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AppColors.backgroundDark : const Color(0xFFF0F2FF);

    return Stack(
      fit: StackFit.expand,
      children: [
        ColoredBox(color: bg),
        // Blue orb — top-left
        Positioned(
          top: -130,
          left: -110,
          child: _Orb(
            size: 480,
            color: AppColors.primary.withOpacity(isDark ? 0.28 : 0.18),
          ),
        ),
        // Purple orb — bottom-right
        Positioned(
          bottom: -150,
          right: -90,
          child: _Orb(
            size: 440,
            color: const Color(0xFF5856D6).withOpacity(isDark ? 0.22 : 0.13),
          ),
        ),
        // Teal accent — mid-right
        Positioned(
          top: 280,
          right: -50,
          child: _Orb(
            size: 280,
            color: const Color(0xFF5AC8FA).withOpacity(isDark ? 0.16 : 0.09),
          ),
        ),
        child,
      ],
    );
  }
}

class _Orb extends StatelessWidget {
  const _Orb({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: DecoratedBox(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [color, color.withOpacity(0)],
          ),
        ),
      ),
    );
  }
}

// ── Glass card ────────────────────────────────────────────────────────────────

/// Frosted-glass card used on all auth screens.
class AuthGlassCard extends StatelessWidget {
  const AuthGlassCard({
    super.key,
    required this.child,
    this.padding,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ClipRRect(
      borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
        child: Container(
          padding: padding ?? const EdgeInsets.all(AppSpacing.xxl),
          decoration: BoxDecoration(
            color: isDark
                ? Colors.white.withOpacity(0.07)
                : Colors.white.withOpacity(0.78),
            borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
            border: Border.all(
              color: isDark
                  ? Colors.white.withOpacity(0.13)
                  : Colors.white.withOpacity(0.85),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.38 : 0.10),
                blurRadius: 48,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}

// ── Shared form field ─────────────────────────────────────────────────────────

class AuthField extends StatelessWidget {
  const AuthField({
    super.key,
    required this.controller,
    required this.label,
    required this.hint,
    required this.isDark,
    this.icon,
    this.keyboardType,
    this.textCapitalization = TextCapitalization.none,
    this.obscureText = false,
    this.suffixIcon,
    this.autofocus = false,
    this.validator,
    this.onFieldSubmitted,
    this.textInputAction,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final bool isDark;
  final IconData? icon;
  final TextInputType? keyboardType;
  final TextCapitalization textCapitalization;
  final bool obscureText;
  final Widget? suffixIcon;
  final bool autofocus;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onFieldSubmitted;
  final TextInputAction? textInputAction;

  @override
  Widget build(BuildContext context) {
    final labelColor =
        isDark ? Colors.white.withOpacity(0.75) : Colors.black.withOpacity(0.65);
    final textColor =
        isDark ? Colors.white : const Color(0xFF1D1D1F);
    final hintColor =
        isDark ? Colors.white.withOpacity(0.30) : Colors.black.withOpacity(0.28);
    final iconColor =
        isDark ? Colors.white.withOpacity(0.38) : Colors.black.withOpacity(0.32);
    final borderColor =
        isDark ? Colors.white.withOpacity(0.16) : Colors.black.withOpacity(0.12);
    final fillColor =
        isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.03);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: labelColor,
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.12,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          textCapitalization: textCapitalization,
          obscureText: obscureText,
          autofocus: autofocus,
          validator: validator,
          onFieldSubmitted: onFieldSubmitted,
          textInputAction: textInputAction,
          style: TextStyle(
            color: textColor,
            fontSize: 14,
            fontWeight: FontWeight.w400,
            letterSpacing: -0.15,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: hintColor,
              fontSize: 14,
              letterSpacing: -0.15,
            ),
            prefixIcon: icon != null
                ? Icon(icon, size: 17, color: iconColor)
                : null,
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: fillColor,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.md,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 2),
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 2),
              borderSide: BorderSide(color: borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 2),
              borderSide:
                  const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 2),
              borderSide:
                  BorderSide(color: AppColors.error.withOpacity(0.7)),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 2),
              borderSide: const BorderSide(color: AppColors.error, width: 1.5),
            ),
            errorStyle: TextStyle(
              fontSize: 11,
              letterSpacing: -0.1,
              color: AppColors.error.withOpacity(0.85),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Or divider ────────────────────────────────────────────────────────────────

class AuthDivider extends StatelessWidget {
  const AuthDivider({super.key, required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final color = isDark
        ? Colors.white.withOpacity(0.14)
        : Colors.black.withOpacity(0.10);
    final textColor = isDark
        ? Colors.white.withOpacity(0.35)
        : Colors.black.withOpacity(0.30);

    return Row(
      children: [
        Expanded(child: Divider(color: color, thickness: 1, height: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          child: Text(
            'or',
            style: TextStyle(
              color: textColor,
              fontSize: 12,
              letterSpacing: -0.1,
            ),
          ),
        ),
        Expanded(child: Divider(color: color, thickness: 1, height: 1)),
      ],
    );
  }
}

// ── Error banner ──────────────────────────────────────────────────────────────

class AuthErrorBanner extends StatelessWidget {
  const AuthErrorBanner({
    super.key,
    required this.message,
    required this.isDark,
  });

  final String message;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm + 2,
      ),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(isDark ? 0.15 : 0.08),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
            color: AppColors.error.withOpacity(isDark ? 0.35 : 0.25)),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline_rounded,
              color: AppColors.error.withOpacity(0.85), size: 15),
          const SizedBox(width: AppSpacing.xs),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: AppColors.error.withOpacity(0.9),
                fontSize: 12,
                letterSpacing: -0.1,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Footer link ───────────────────────────────────────────────────────────────

class AuthFooterLink extends StatelessWidget {
  const AuthFooterLink({
    super.key,
    required this.prefix,
    required this.linkText,
    required this.isDark,
    required this.onTap,
  });

  final String prefix;
  final String linkText;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final textColor = isDark
        ? Colors.white.withOpacity(0.50)
        : Colors.black.withOpacity(0.45);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          prefix,
          style: TextStyle(
            color: textColor,
            fontSize: 13,
            letterSpacing: -0.12,
          ),
        ),
        MouseRegion(
          cursor: SystemMouseCursors.click,
          child: GestureDetector(
            onTap: onTap,
            child: Text(
              linkText,
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 13,
                fontWeight: FontWeight.w600,
                letterSpacing: -0.12,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
