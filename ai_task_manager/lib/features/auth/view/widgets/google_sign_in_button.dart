import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:ai_task_manager/core/theme/app_spacing.dart';

class GoogleSignInButton extends StatefulWidget {
  const GoogleSignInButton({
    super.key,
    required this.onPressed,
    this.isLoading = false,
  });

  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  State<GoogleSignInButton> createState() => _GoogleSignInButtonState();
}

class _GoogleSignInButtonState extends State<GoogleSignInButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isDisabled = widget.onPressed == null;

    final bgColor = isDisabled
        ? (isDark
            ? Colors.white.withOpacity(0.03)
            : Colors.black.withOpacity(0.02))
        : _hovered
            ? (isDark
                ? Colors.white.withOpacity(0.12)
                : Colors.black.withOpacity(0.06))
            : (isDark
                ? Colors.white.withOpacity(0.07)
                : Colors.black.withOpacity(0.04));

    final borderColor = isDisabled
        ? (isDark
            ? Colors.white.withOpacity(0.08)
            : Colors.black.withOpacity(0.06))
        : (isDark
            ? Colors.white.withOpacity(0.16)
            : Colors.black.withOpacity(0.12));

    final textColor = isDisabled
        ? (isDark
            ? Colors.white.withOpacity(0.30)
            : Colors.black.withOpacity(0.28))
        : (isDark ? Colors.white.withOpacity(0.85) : const Color(0xFF1D1D1F));

    return MouseRegion(
      cursor: isDisabled ? MouseCursor.defer : SystemMouseCursors.click,
      onEnter: (_) {
        if (!isDisabled) setState(() => _hovered = true);
      },
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.isLoading ? null : widget.onPressed,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          height: 44,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 2),
            border: Border.all(color: borderColor),
          ),
          child: widget.isLoading
              ? Center(
                  child: SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 1.5,
                      valueColor: AlwaysStoppedAnimation<Color>(textColor),
                    ),
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Opacity(
                      opacity: isDisabled ? 0.4 : 1.0,
                      child: SvgPicture.asset(
                        'assets/icons/google.svg',
                        width: 18,
                        height: 18,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm + 2),
                    Text(
                      'Continue with Google',
                      style: TextStyle(
                        color: textColor,
                        fontSize: 14,
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
