import 'package:flutter/material.dart';

import 'package:ai_task_manager/core/theme/app_colors.dart';

/// Centralized user avatar widget.
///
/// Shows [avatarUrl] when available, otherwise falls back to the first letter
/// of [name] on a primary-tinted background — consistent across the whole app.
class UserAvatar extends StatelessWidget {
  const UserAvatar({
    super.key,
    required this.name,
    this.avatarUrl,
    this.radius = 22,
  });

  final String name;
  final String? avatarUrl;

  /// CircleAvatar radius. Defaults to 22 (matching the Team screen reference).
  final double radius;

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.primary.withValues(alpha: 0.15),
      backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl!) : null,
      child: avatarUrl == null
          ? Text(
              name.isNotEmpty ? name[0].toUpperCase() : '?',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: radius * 0.8,
                fontWeight: FontWeight.w700,
              ),
            )
          : null,
    );
  }
}
