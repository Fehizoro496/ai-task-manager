import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/admin/model/admin_user_model.dart';
import 'package:ai_task_manager/features/admin/viewmodel/admin_viewmodel.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  static const String routeName = '/admin';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filter = ref.watch(adminUserFilterProvider);
    final usersAsync = ref.watch(adminUsersProvider);

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(context, isDark),
          _buildTabs(context, ref, isDark, filter),
          Expanded(
            child: usersAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.error_outline_rounded,
                        color: AppColors.error, size: 48),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      err is ServerException
                          ? err.message
                          : err.toString(),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.error,
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    TextButton.icon(
                      onPressed: () =>
                          ref.read(adminUsersProvider.notifier).refresh(),
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
              data: (users) => users.isEmpty
                  ? _buildEmptyState(context, isDark, filter)
                  : RefreshIndicator(
                      onRefresh: () =>
                          ref.read(adminUsersProvider.notifier).refresh(),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        itemCount: users.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: AppSpacing.sm),
                        itemBuilder: (context, index) => _UserTile(
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
                child: const Icon(
                  Icons.admin_panel_settings_rounded,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Text(
                'Admin Panel',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Manage user registration approvals',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
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

    return Container(
      height: 44,
      margin:
          const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: tabs.map((tab) {
          final isSelected = filter == tab.value;
          return Padding(
            padding: const EdgeInsets.only(right: AppSpacing.sm),
            child: ChoiceChip(
              label: Text(tab.label),
              selected: isSelected,
              onSelected: (_) {
                ref.read(adminUserFilterProvider.notifier).state = tab.value;
                ref.read(adminUsersProvider.notifier).refresh();
              },
              selectedColor: tab.color.withOpacity(0.2),
              backgroundColor:
                  isDark ? AppColors.surfaceDark : AppColors.cardLight,
              labelStyle: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: isSelected
                        ? tab.color
                        : isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                    fontWeight:
                        isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
              side: BorderSide(
                color: isSelected
                    ? tab.color.withOpacity(0.5)
                    : isDark
                        ? AppColors.borderDark
                        : AppColors.borderLight,
              ),
            ),
          );
        }).toList(),
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
          Icon(
            Icons.people_outline_rounded,
            size: 64,
            color: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                ),
          ),
        ],
      ),
    );
  }
}

class _UserTile extends ConsumerWidget {
  final AdminUserModel user;
  final bool isDark;

  const _UserTile({required this.user, required this.isDark});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
        ),
      ),
      child: Row(
        children: [
          _buildAvatar(context),
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
                        style:
                            Theme.of(context).textTheme.titleSmall?.copyWith(
                                  color: isDark
                                      ? AppColors.textPrimaryDark
                                      : AppColors.textPrimaryLight,
                                  fontWeight: FontWeight.w600,
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
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
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
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: isDark
                                ? AppColors.textTertiaryDark
                                : AppColors.textTertiaryLight,
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
    );
  }

  Widget _buildAvatar(BuildContext context) {
    return CircleAvatar(
      radius: 22,
      backgroundColor: AppColors.primary.withOpacity(0.15),
      backgroundImage:
          user.avatarUrl != null ? NetworkImage(user.avatarUrl!) : null,
      child: user.avatarUrl == null
          ? Text(
              user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            )
          : null,
    );
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
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
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
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: isDark
                      ? AppColors.textTertiaryDark
                      : AppColors.textTertiaryLight,
                  fontSize: 10,
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
          onTap: () => ref.read(adminUsersProvider.notifier).approveUser(user.id),
        ),
        const SizedBox(width: AppSpacing.xs),
        _ActionButton(
          icon: Icons.close_rounded,
          color: AppColors.error,
          tooltip: 'Reject',
          onTap: () => ref.read(adminUsersProvider.notifier).rejectUser(user.id),
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.sm),
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
      ),
    );
  }
}
