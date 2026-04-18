import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import 'package:ai_task_manager/core/design_system/app_button.dart';
import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/admin/model/admin_user_model.dart';
import 'package:ai_task_manager/features/admin/viewmodel/admin_viewmodel.dart';
import 'package:ai_task_manager/shared/user_avatar.dart';

class TeamScreen extends ConsumerWidget {
  const TeamScreen({super.key});

  static const String routeName = '/team';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filter = ref.watch(adminUserFilterProvider);
    final usersAsync = ref.watch(adminUsersProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: DecoratedBox(
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeader(context, isDark),
                    _buildTabs(context, ref, isDark, filter),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: usersAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
              error: (err, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline_rounded,
                        color: AppColors.error, size: 48),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      err is ServerException ? err.message : err.toString(),
                      style: TextStyle(
                        color: AppColors.error,
                        fontSize: 13,
                        letterSpacing: -0.1,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    AppButton(
                      label: 'Retry',
                      icon: Icons.refresh_rounded,
                      onPressed: () =>
                          ref.read(adminUsersProvider.notifier).refresh(),
                      variant: AppButtonVariant.secondary,
                      size: AppButtonSize.sm,
                    ),
                  ],
                ),
              ),
              data: (users) => users.isEmpty
                  ? _buildEmptyState(context, isDark, filter)
                  : RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: () =>
                          ref.read(adminUsersProvider.notifier).refresh(),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(AppSpacing.xl),
                        itemCount: users.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: AppSpacing.sm),
                        itemBuilder: (context, index) => _TeamMemberTile(
                          user: users[index],
                          isDark: isDark,
                        ),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, bool isDark) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl, AppSpacing.xl, AppSpacing.xl, AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Team',
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
            'Manage and review team members',
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

  Widget _buildTabs(
      BuildContext context, WidgetRef ref, bool isDark, String? filter) {
    final tabs = [
      (label: 'Pending', value: 'PENDING', color: AppColors.warning),
      (label: 'All', value: null, color: AppColors.primary),
      (label: 'Approved', value: 'APPROVED', color: AppColors.success),
      (label: 'Rejected', value: 'REJECTED', color: AppColors.error),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
        child: Row(
          children: tabs.map((tab) {
            final isSelected = filter == tab.value;
            return Padding(
              padding: const EdgeInsets.only(right: AppSpacing.sm),
              child: _FilterPill(
                label: tab.label,
                selected: isSelected,
                color: tab.color,
                isDark: isDark,
                onTap: () {
                  ref.read(adminUserFilterProvider.notifier).state = tab.value;
                  ref.read(adminUsersProvider.notifier).refresh();
                },
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildEmptyState(
      BuildContext context, bool isDark, String? filter) {
    final message = filter == 'PENDING'
        ? 'No pending registrations'
        : filter == 'APPROVED'
            ? 'No approved users'
            : filter == 'REJECTED'
                ? 'No rejected users'
                : 'No users found';

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
              Icons.people_outline_rounded,
              size: 32,
              color: isDark
                  ? AppColors.textTertiaryDark
                  : AppColors.textTertiaryLight,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            message,
            style: TextStyle(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
              fontSize: 15,
              fontWeight: FontWeight.w500,
              letterSpacing: -0.2,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Filter pill ───────────────────────────────────────────────────────────────

class _FilterPill extends StatefulWidget {
  const _FilterPill({
    required this.label,
    required this.selected,
    required this.color,
    required this.isDark,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final Color color;
  final bool isDark;
  final VoidCallback onTap;

  @override
  State<_FilterPill> createState() => _FilterPillState();
}

class _FilterPillState extends State<_FilterPill> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final bg = widget.selected
        ? widget.color.withOpacity(0.14)
        : _hovered
            ? (widget.isDark
                ? Colors.white.withOpacity(0.06)
                : Colors.black.withOpacity(0.04))
            : Colors.transparent;

    final textColor = widget.selected
        ? widget.color
        : (widget.isDark
            ? AppColors.textSecondaryDark
            : AppColors.textSecondaryLight);

    final borderColor = widget.selected
        ? widget.color.withOpacity(0.38)
        : (widget.isDark ? AppColors.borderDark : AppColors.borderLight);

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            border: Border.all(color: borderColor),
          ),
          child: Text(
            widget.label,
            style: TextStyle(
              color: textColor,
              fontSize: 12,
              fontWeight: widget.selected ? FontWeight.w600 : FontWeight.w400,
              letterSpacing: -0.1,
            ),
          ),
        ),
      ),
    );
  }
}

// ── Team member tile ──────────────────────────────────────────────────────────

class _TeamMemberTile extends ConsumerWidget {
  final AdminUserModel user;
  final bool isDark;

  const _TeamMemberTile({required this.user, required this.isDark});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.07) : Colors.white.withOpacity(0.76),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.10) : Colors.white.withOpacity(0.85),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.25 : 0.06),
            blurRadius: 18,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          _buildAvatar(),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        user.name,
                        style: TextStyle(
                          color: isDark
                              ? AppColors.textPrimaryDark
                              : AppColors.textPrimaryLight,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -0.2,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    _buildStatusBadge(context),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  user.email,
                  style: TextStyle(
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight,
                    fontSize: 12,
                    letterSpacing: -0.1,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    _buildProviderBadge(context),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      DateFormat('MMM d, yyyy').format(user.createdAt),
                      style: TextStyle(
                        color: isDark
                            ? AppColors.textTertiaryDark
                            : AppColors.textTertiaryLight,
                        fontSize: 11,
                        letterSpacing: -0.1,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (user.isPending) ...[
            const SizedBox(width: AppSpacing.sm),
            _buildActions(context, ref),
          ],
        ],
      ),
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    return UserAvatar(name: user.name, avatarUrl: user.avatarUrl);
  }

  Widget _buildStatusBadge(BuildContext context) {
    final Color color;
    final String label;

    if (user.isAdmin) {
      color = AppColors.primary;
      label = 'Admin';
    } else if (user.isPending) {
      color = AppColors.warning;
      label = 'Pending';
    } else if (user.isApproved) {
      color = AppColors.success;
      label = 'Approved';
    } else {
      color = AppColors.error;
      label = 'Rejected';
    }

    return Container(
      padding:
          const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.1,
        ),
      ),
    );
  }

  Widget _buildProviderBadge(BuildContext context) {
    final isGoogle = user.provider == 'google';
    return Container(
      padding:
          const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 2),
      decoration: BoxDecoration(
        color: (isDark ? AppColors.borderDark : AppColors.borderLight)
            .withOpacity(0.5),
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isGoogle ? Icons.account_circle_rounded : Icons.email_outlined,
            size: 10,
            color: isDark
                ? AppColors.textTertiaryDark
                : AppColors.textTertiaryLight,
          ),
          const SizedBox(width: 3),
          Text(
            isGoogle ? 'Google' : 'Email',
            style: TextStyle(
              color: isDark
                  ? AppColors.textTertiaryDark
                  : AppColors.textTertiaryLight,
              fontSize: 10,
              letterSpacing: -0.1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActions(BuildContext context, WidgetRef ref) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _ActionButton(
          icon: Icons.check_rounded,
          color: AppColors.success,
          tooltip: 'Approve',
          onTap: () =>
              ref.read(adminUsersProvider.notifier).approveUser(user.id),
        ),
        const SizedBox(width: AppSpacing.xs),
        _ActionButton(
          icon: Icons.close_rounded,
          color: AppColors.error,
          tooltip: 'Reject',
          onTap: () =>
              ref.read(adminUsersProvider.notifier).rejectUser(user.id),
        ),
      ],
    );
  }
}

// ── Action button ─────────────────────────────────────────────────────────────

class _ActionButton extends StatefulWidget {
  final IconData icon;
  final Color color;
  final String tooltip;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.color,
    required this.tooltip,
    required this.onTap,
  });

  @override
  State<_ActionButton> createState() => _ActionButtonState();
}

class _ActionButtonState extends State<_ActionButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: widget.tooltip,
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        onEnter: (_) => setState(() => _hovered = true),
        onExit: (_) => setState(() => _hovered = false),
        child: GestureDetector(
          onTap: widget.onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 140),
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: widget.color
                  .withOpacity(_hovered ? 0.20 : 0.12),
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Icon(widget.icon, color: widget.color, size: 18),
          ),
        ),
      ),
    );
  }
}
