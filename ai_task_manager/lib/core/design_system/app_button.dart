import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';

enum AppButtonVariant { primary, secondary, ghost, danger, success }

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
  bool _isPressed = false;

  double get _height {
    switch (widget.size) {
      case AppButtonSize.sm: return 30.0;
      case AppButtonSize.md: return 38.0;
      case AppButtonSize.lg: return 46.0;
    }
  }

  EdgeInsets get _padding {
    switch (widget.size) {
      case AppButtonSize.sm:
        return const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs);
      case AppButtonSize.md:
        return const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm);
      case AppButtonSize.lg:
        return const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.md);
    }
  }

  double get _fontSize {
    switch (widget.size) {
      case AppButtonSize.sm: return 12.0;
      case AppButtonSize.md: return 14.0;
      case AppButtonSize.lg: return 16.0;
    }
  }

  double get _iconSize {
    switch (widget.size) {
      case AppButtonSize.sm: return 13.0;
      case AppButtonSize.md: return 15.0;
      case AppButtonSize.lg: return 18.0;
    }
  }

  Color _backgroundColor(bool isDark) {
    final disabled = widget.onPressed == null;
    if (disabled) {
      return isDark
          ? AppColors.surfaceDark.withOpacity(0.5)
          : AppColors.hoverLight;
    }
    switch (widget.variant) {
      case AppButtonVariant.primary:
        // Apple: hover brightens slightly, press dims to #EDEDF2-equivalent
        if (_isPressed) return AppColors.primary.withOpacity(0.80);
        return _isHovered ? const Color(0xFF0077ED) : AppColors.primary;
      case AppButtonVariant.secondary:
        return _isHovered || _isPressed
            ? (isDark ? AppColors.hoverDark : AppColors.hoverLight)
            : Colors.transparent;
      case AppButtonVariant.ghost:
        return _isHovered || _isPressed
            ? (isDark ? AppColors.hoverDark : AppColors.hoverLight)
            : Colors.transparent;
      case AppButtonVariant.danger:
        if (_isPressed) return AppColors.error.withOpacity(0.80);
        return _isHovered ? AppColors.error.withOpacity(0.85) : AppColors.error;
      case AppButtonVariant.success:
        if (_isPressed) return AppColors.success.withOpacity(0.80);
        return _isHovered ? AppColors.success.withOpacity(0.85) : AppColors.success;
    }
  }

  Color _foregroundColor(bool isDark) {
    if (widget.onPressed == null) {
      return isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;
    }
    switch (widget.variant) {
      case AppButtonVariant.primary:  return Colors.white;
      case AppButtonVariant.secondary: return isDark ? AppColors.primaryLight : AppColors.primaryDark;
      case AppButtonVariant.ghost:
        return isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
      case AppButtonVariant.danger:   return Colors.white;
      case AppButtonVariant.success:  return Colors.white;
    }
  }

  BorderSide? _borderSide(bool isDark) {
    if (widget.variant == AppButtonVariant.secondary) {
      final disabled = widget.onPressed == null;
      return BorderSide(
        color: disabled
            ? (isDark ? AppColors.borderDark : AppColors.borderLight)
            : (isDark ? AppColors.primaryLight : AppColors.primary),
        width: 1,
      );
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = _backgroundColor(isDark);
    final fgColor = _foregroundColor(isDark);
    final border = _borderSide(isDark);

    return MouseRegion(
      cursor: widget.onPressed != null
          ? SystemMouseCursors.click
          : SystemMouseCursors.basic,
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() {
        _isHovered = false;
        _isPressed = false;
      }),
      child: GestureDetector(
        onTap: widget.isLoading ? null : widget.onPressed,
        onTapDown: (_) => setState(() => _isPressed = true),
        onTapUp: (_) => setState(() => _isPressed = false),
        onTapCancel: () => setState(() => _isPressed = false),
        child: AnimatedContainer(
          duration: AppConstants.animationDuration,
          curve: Curves.easeOut,
          height: _height,
          padding: _padding,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: border != null ? Border.fromBorderSide(border) : null,
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
                    strokeWidth: 1.5,
                    valueColor: AlwaysStoppedAnimation<Color>(fgColor),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
              ] else if (widget.icon != null) ...[
                Icon(widget.icon, size: _iconSize, color: fgColor),
                const SizedBox(width: AppSpacing.xs + 2),
              ],
              Text(
                widget.label,
                style: TextStyle(
                  color: fgColor,
                  fontSize: _fontSize,
                  fontWeight: FontWeight.w400,
                  letterSpacing: -0.15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
