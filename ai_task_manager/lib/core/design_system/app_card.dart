import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
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
    final cardColor = isDark ? AppColors.cardDark : AppColors.cardLight;
    final borderColor = _isHovered
        ? (isDark ? AppColors.borderDark.withOpacity(0.8) : AppColors.primary.withOpacity(0.2))
        : (isDark ? AppColors.borderDark : AppColors.borderLight);

    return MouseRegion(
      cursor:
          widget.onTap != null ? SystemMouseCursors.click : MouseCursor.defer,
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: AppConstants.animationDuration,
          curve: Curves.easeInOut,
          padding: widget.padding ?? AppSpacing.paddingLg,
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            border: Border.all(color: borderColor, width: 1.0),
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? Colors.black.withOpacity(_isHovered ? 0.3 : 0.15)
                    : Colors.black.withOpacity(_isHovered ? 0.08 : 0.03),
                blurRadius: _isHovered ? 12 : 6,
                offset: Offset(0, _isHovered ? 4 : 2),
              ),
            ],
          ),
          child: widget.child,
        ),
      ),
    );
  }
}
