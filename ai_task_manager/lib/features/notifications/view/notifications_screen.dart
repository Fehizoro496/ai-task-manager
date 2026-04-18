import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'package:ai_task_manager/core/design_system/app_button.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/notifications/model/notification_entity.dart';
import 'package:ai_task_manager/features/notifications/viewmodel/notification_viewmodel.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final hasUnread = notificationsAsync.maybeWhen(
      data: (list) => list.any((n) => !n.isRead),
      orElse: () => false,
    );

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(context, ref, isDark, hasUnread),
          Expanded(
            child: notificationsAsync.when(
              data: (notifications) {
                if (notifications.isEmpty) {
                  return _buildEmptyState(isDark);
                }
                return RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: () =>
                      ref.read(notificationsProvider.notifier).refresh(),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.xl,
                      AppSpacing.sm,
                      AppSpacing.xl,
                      AppSpacing.xl,
                    ),
                    itemCount: notifications.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AppSpacing.sm),
                    itemBuilder: (context, index) {
                      final notification = notifications[index];
                      return _NotificationTile(
                        notification: notification,
                        isDark: isDark,
                        onTap: () {
                          ref
                              .read(notificationsProvider.notifier)
                              .markAsRead(notification.id);
                          final base = notification.link;
                          final dest = notification.taskId.isNotEmpty
                              ? '$base?taskId=${notification.taskId}'
                              : base;
                          context.go(dest);
                        },
                      );
                    },
                  ),
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
              error: (error, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.error_outline_rounded,
                      size: 48,
                      color: AppColors.error,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      'Failed to load',
                      style: TextStyle(
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    AppButton(
                      label: 'Retry',
                      onPressed: () =>
                          ref.read(notificationsProvider.notifier).refresh(),
                      variant: AppButtonVariant.secondary,
                      size: AppButtonSize.sm,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(
      BuildContext context, WidgetRef ref, bool isDark, bool hasUnread) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF000000).withOpacity(0.80)
                : Colors.white.withOpacity(0.82),
            border: Border(
              bottom: BorderSide(
                color: isDark
                    ? Colors.white.withOpacity(0.08)
                    : Colors.black.withOpacity(0.07),
                width: 1,
              ),
            ),
          ),
          child: Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl, AppSpacing.xl, AppSpacing.md, AppSpacing.sm),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Notifications',
                  style: TextStyle(
                    color: isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.56,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Stay up to date',
                  style: TextStyle(
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight,
                    fontSize: 13,
                    letterSpacing: -0.1,
                  ),
                ),
              ],
            ),
          ),
          if (hasUnread)
            AppButton(
              label: 'Mark all read',
              onPressed: () =>
                  ref.read(notificationsProvider.notifier).markAllAsRead(),
              variant: AppButtonVariant.secondary,
              size: AppButtonSize.sm,
            ),
        ],
          ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.hoverLight,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.notifications_none_rounded,
              size: 32,
              color: isDark
                  ? AppColors.textTertiaryDark
                  : AppColors.textTertiaryLight,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'No notifications',
            style: TextStyle(
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
              fontSize: 16,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            "You're all caught up!",
            style: TextStyle(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
              fontSize: 13,
              letterSpacing: -0.1,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Notification tile ─────────────────────────────────────────────────────────

class _NotificationTile extends StatefulWidget {
  final NotificationEntity notification;
  final bool isDark;
  final VoidCallback onTap;

  const _NotificationTile({
    required this.notification,
    required this.isDark,
    required this.onTap,
  });

  @override
  State<_NotificationTile> createState() => _NotificationTileState();
}

class _NotificationTileState extends State<_NotificationTile> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final isUnread = !widget.notification.isRead;
    final isDark = widget.isDark;

    final Color bg;
    if (isUnread) {
      bg = isDark
          ? AppColors.primary.withValues(alpha: 0.10)
          : AppColors.primary.withOpacity(0.04);
    } else {
      bg = isDark ? AppColors.cardDark : Colors.white;
    }

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: isUnread
                ? (isDark
                    ? AppColors.primary.withOpacity(_hovered ? 0.16 : 0.12)
                    : AppColors.primary.withOpacity(_hovered ? 0.09 : 0.06))
                : (isDark
                    ? Colors.white.withOpacity(_hovered ? 0.11 : 0.07)
                    : Colors.white.withOpacity(_hovered ? 0.88 : 0.76)),
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(
              color: isUnread
                  ? AppColors.primary.withOpacity(isDark ? 0.30 : 0.20)
                  : (isDark
                      ? Colors.white.withOpacity(0.10)
                      : Colors.white.withOpacity(0.85)),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.22 : 0.06),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildTypeIcon(),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            widget.notification.title,
                            style: TextStyle(
                              fontWeight:
                                  isUnread ? FontWeight.w600 : FontWeight.w400,
                              color: isDark
                                  ? AppColors.textPrimaryDark
                                  : AppColors.textPrimaryLight,
                              fontSize: 14,
                              letterSpacing: -0.15,
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Text(
                          _relativeDate(widget.notification.createdAt),
                          style: TextStyle(
                            color: isDark
                                ? AppColors.textTertiaryDark
                                : AppColors.textTertiaryLight,
                            fontSize: 11,
                            letterSpacing: -0.1,
                          ),
                        ),
                        if (isUnread) ...[
                          const SizedBox(width: AppSpacing.xs),
                          Container(
                            width: 7,
                            height: 7,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xxs),
                    Text(
                      widget.notification.message,
                      style: TextStyle(
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                        fontSize: 13,
                        letterSpacing: -0.1,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTypeIcon() {
    final IconData icon;
    final Color color;

    switch (widget.notification.type) {
      case NotificationType.taskAssigned:
        icon = Icons.person_add_rounded;
        color = AppColors.primary;
        break;
      case NotificationType.taskUpdated:
        icon = Icons.edit_rounded;
        color = AppColors.info;
        break;
      case NotificationType.taskStatusChanged:
        icon = Icons.swap_horiz_rounded;
        color = AppColors.success;
        break;
    }

    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 17, color: color),
    );
  }

  String _relativeDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inHours < 1) return '${diff.inMinutes}m';
    if (diff.inDays < 1) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return DateFormat('dd/MM/yyyy').format(date);
  }
}
