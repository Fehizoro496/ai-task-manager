import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';

class AppDialog extends StatelessWidget {
  const AppDialog({
    super.key,
    required this.title,
    required this.content,
    this.actions = const [],
  });

  final String title;
  final Widget content;
  final List<Widget> actions;

  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    required Widget content,
    List<Widget> actions = const [],
  }) {
    return showGeneralDialog<T>(
      context: context,
      barrierDismissible: true,
      barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
      barrierColor: Colors.black.withOpacity(0.5),
      transitionDuration: AppConstants.animationDurationSlow,
      pageBuilder: (context, animation, secondaryAnimation) {
        return AppDialog(
          title: title,
          content: content,
          actions: actions,
        );
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        final curvedAnimation = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutCubic,
        );
        return BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: 4.0 * curvedAnimation.value,
            sigmaY: 4.0 * curvedAnimation.value,
          ),
          child: FadeTransition(
            opacity: curvedAnimation,
            child: ScaleTransition(
              scale: Tween<double>(begin: 0.9, end: 1.0)
                  .animate(curvedAnimation),
              child: child,
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final backgroundColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final titleColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final dividerColor = isDark ? AppColors.dividerDark : AppColors.dividerLight;

    return Center(
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: 480,
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.9,
            maxHeight: MediaQuery.of(context).size.height * 0.85,
          ),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.4 : 0.15),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
            border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight,
              width: 1.0,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.xxl,
                  AppSpacing.xxl,
                  AppSpacing.xxl,
                  AppSpacing.lg,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          color: titleColor,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                    _CloseButton(isDark: isDark),
                  ],
                ),
              ),
              Divider(height: 1, color: dividerColor),
              Flexible(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.xxl),
                  child: content,
                ),
              ),
              if (actions.isNotEmpty) ...[
                Divider(height: 1, color: dividerColor),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: actions
                        .expand(
                          (action) => [
                            action,
                            const SizedBox(width: AppSpacing.sm),
                          ],
                        )
                        .toList()
                      ..removeLast(),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _CloseButton extends StatefulWidget {
  const _CloseButton({required this.isDark});

  final bool isDark;

  @override
  State<_CloseButton> createState() => _CloseButtonState();
}

class _CloseButtonState extends State<_CloseButton> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: () => Navigator.of(context).pop(),
        child: AnimatedContainer(
          duration: AppConstants.animationDuration,
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: _isHovered
                ? (widget.isDark ? AppColors.hoverDark : AppColors.hoverLight)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          ),
          child: Icon(
            Icons.close_rounded,
            size: 18,
            color: widget.isDark
                ? AppColors.textTertiaryDark
                : AppColors.textTertiaryLight,
          ),
        ),
      ),
    );
  }
}
