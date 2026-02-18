import 'package:flutter/material.dart';

import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';

class GoogleSignInButton extends StatelessWidget {
  const GoogleSignInButton({
    super.key,
    required this.onPressed,
    this.isLoading = false,
  });

  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final backgroundColor = isDark ? AppColors.surfaceDark : Colors.white;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;

    return SizedBox(
      width: double.infinity,
      height: 48,
      child: OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: backgroundColor,
          side: BorderSide(color: borderColor),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        ),
        child: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(textColor),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _GoogleLogo(size: 20),
                  const SizedBox(width: AppSpacing.md),
                  Text(
                    'Se connecter avec Google',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: textColor,
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                ],
              ),
      ),
    );
  }
}

/// Paints the Google "G" logo using the official four-color scheme.
class _GoogleLogo extends StatelessWidget {
  const _GoogleLogo({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _GoogleLogoPainter(),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Draw circular background
    final bgPaint = Paint()..color = Colors.white;
    canvas.drawCircle(center, radius, bgPaint);

    final rect = Rect.fromCircle(center: center, radius: radius);

    // Red arc (top-right)
    _drawArc(canvas, rect, -10, 100,
        const Color(0xFFEA4335)); // Google Red
    // Yellow arc (bottom-right / bottom)
    _drawArc(canvas, rect, 90, 90,
        const Color(0xFFFBBC05)); // Google Yellow
    // Green arc (bottom-left / left)
    _drawArc(canvas, rect, 180, 90,
        const Color(0xFF34A853)); // Google Green
    // Blue arc (top-left)
    _drawArc(canvas, rect, 270, 80,
        const Color(0xFF4285F4)); // Google Blue

    // White inner circle to create ring
    final innerPaint = Paint()..color = Colors.white;
    canvas.drawCircle(center, radius * 0.6, innerPaint);

    // Blue "G" right bar
    final bluePaint = Paint()..color = const Color(0xFF4285F4);
    final barRect = Rect.fromLTWH(
      center.dx,
      center.dy - radius * 0.2,
      radius,
      radius * 0.4,
    );
    canvas.drawRect(barRect, bluePaint);

    // Redraw inner white circle for clean look
    canvas.drawCircle(center, radius * 0.58, innerPaint);
  }

  void _drawArc(Canvas canvas, Rect rect, double startDegrees,
      double sweepDegrees, Color color) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    canvas.drawArc(
      rect,
      _toRadians(startDegrees),
      _toRadians(sweepDegrees),
      true,
      paint,
    );
  }

  double _toRadians(double degrees) => degrees * 3.141592653589793 / 180;

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
