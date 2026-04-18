import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/theme/app_theme.dart';
import 'package:ai_task_manager/core/utils/constants.dart';

class AppCard extends StatefulWidget {
  const AppCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding,
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;

  @override
  State<AppCard> createState() => _AppCardState();
}

class _AppCardState extends State<AppCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.cardDark : AppColors.surfaceLight;

    final shadows = _isHovered
        ? [
            BoxShadow(
              color: isDark
                  ? Colors.black.withOpacity(0.40)
                  : Colors.black.withOpacity(0.14),
              blurRadius: 30,
              offset: const Offset(0, 8),
            ),
          ]
        : AppTheme.cardShadow(isDark);

    return MouseRegion(
      cursor: widget.onTap != null ? SystemMouseCursors.click : MouseCursor.defer,
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: AnimatedContainer(
              duration: AppConstants.animationDuration,
              curve: Curves.easeOut,
              padding: widget.padding ?? AppSpacing.paddingLg,
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.white.withOpacity(_isHovered ? 0.11 : 0.07)
                    : Colors.white.withOpacity(_isHovered ? 0.88 : 0.74),
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                border: Border.all(
                  color: _isHovered
                      ? AppColors.primary.withOpacity(isDark ? 0.35 : 0.25)
                      : (isDark
                          ? Colors.white.withOpacity(0.10)
                          : Colors.white.withOpacity(0.85)),
                ),
                boxShadow: shadows,
              ),
              child: widget.child,
            ),
          ),
        ),
      ),
    );
  }
}
