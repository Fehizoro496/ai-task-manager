import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';

enum AppButtonVariant { primary, secondary, ghost, danger }

enum AppButtonSize { sm, md, lg }

class AppButton extends StatefulWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.isLoading = false,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final AppButtonVariant variant;
  final AppButtonSize size;

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> {
  bool _isHovered = false;

  double get _height {
    switch (widget.size) {
      case AppButtonSize.sm:
        return 32.0;
      case AppButtonSize.md:
        return 40.0;
      case AppButtonSize.lg:
        return 48.0;
    }
  }

  EdgeInsets get _padding {
    switch (widget.size) {
      case AppButtonSize.sm:
        return const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        );
      case AppButtonSize.md:
        return const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.sm,
        );
      case AppButtonSize.lg:
        return const EdgeInsets.symmetric(
          horizontal: AppSpacing.xl,
          vertical: AppSpacing.md,
        );
    }
  }

  double get _fontSize {
    switch (widget.size) {
      case AppButtonSize.sm:
        return 12.0;
      case AppButtonSize.md:
        return 14.0;
      case AppButtonSize.lg:
        return 16.0;
    }
  }

  double get _iconSize {
    switch (widget.size) {
      case AppButtonSize.sm:
        return 14.0;
      case AppButtonSize.md:
        return 18.0;
      case AppButtonSize.lg:
        return 20.0;
    }
  }

  Color _backgroundColor(bool isDark) {
    if (widget.onPressed == null) {
      return isDark
          ? AppColors.surfaceDark.withOpacity(0.5)
          : AppColors.borderLight;
    }
    switch (widget.variant) {
      case AppButtonVariant.primary:
        return _isHovered ? AppColors.primaryDark : AppColors.primary;
      case AppButtonVariant.secondary:
        return _isHovered
            ? (isDark
                ? AppColors.hoverDark
                : AppColors.primarySurface)
            : Colors.transparent;
      case AppButtonVariant.ghost:
        return _isHovered
            ? (isDark ? AppColors.hoverDark : AppColors.hoverLight)
            : Colors.transparent;
      case AppButtonVariant.danger:
        return _isHovered
            ? AppColors.error.withOpacity(0.85)
            : AppColors.error;
    }
  }

  Color _foregroundColor(bool isDark) {
    if (widget.onPressed == null) {
      return isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;
    }
    switch (widget.variant) {
      case AppButtonVariant.primary:
        return Colors.white;
      case AppButtonVariant.secondary:
        return AppColors.primary;
      case AppButtonVariant.ghost:
        return isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
      case AppButtonVariant.danger:
        return Colors.white;
    }
  }

  Border? _border(bool isDark) {
    if (widget.variant == AppButtonVariant.secondary) {
      return Border.all(
        color: widget.onPressed == null
            ? (isDark ? AppColors.borderDark : AppColors.borderLight)
            : _isHovered
                ? AppColors.primaryLight
                : AppColors.primary.withOpacity(0.4),
        width: 1.5,
      );
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = _backgroundColor(isDark);
    final fgColor = _foregroundColor(isDark);

    return MouseRegion(
      cursor: widget.onPressed != null
          ? SystemMouseCursors.click
          : SystemMouseCursors.basic,
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.isLoading ? null : widget.onPressed,
        child: AnimatedContainer(
          duration: AppConstants.animationDuration,
          curve: Curves.easeInOut,
          height: _height,
          padding: _padding,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: _border(isDark),
            boxShadow: widget.variant == AppButtonVariant.primary &&
                    _isHovered &&
                    widget.onPressed != null
                ? [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.isLoading) ...[
                SizedBox(
                  width: _iconSize,
                  height: _iconSize,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.0,
                    valueColor: AlwaysStoppedAnimation<Color>(fgColor),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
              ] else if (widget.icon != null) ...[
                Icon(widget.icon, size: _iconSize, color: fgColor),
                const SizedBox(width: AppSpacing.sm),
              ],
              Text(
                widget.label,
                style: TextStyle(
                  color: fgColor,
                  fontSize: _fontSize,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
