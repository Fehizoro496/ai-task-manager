import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/admin/model/admin_user_model.dart';
import 'package:ai_task_manager/features/admin/viewmodel/admin_viewmodel.dart';
import 'package:ai_task_manager/shared/user_avatar.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  static const String routeName = '/admin';

  @override
  ConsumerState<AdminDashboardScreen> createState() =>
      _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<AdminUserModel> _filter(List<AdminUserModel> users) {
    final q = _searchQuery.trim().toLowerCase();
    if (q.isEmpty) return users;
    return users
        .where((u) =>
            u.name.toLowerCase().contains(q) ||
            u.email.toLowerCase().contains(q))
        .toList();
  }

  Future<bool> _confirm(String title, String body) async {
    return await showDialog<bool>(
          context: context,
          builder: (ctx) => _ConfirmDialog(title: title, body: body),
        ) ??
        false;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filter = ref.watch(adminUserFilterProvider);
    final usersAsync = ref.watch(adminUsersProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(context, isDark),
          _buildSearchBar(isDark),
          const SizedBox(height: AppSpacing.sm),
          _buildFilterBar(context, isDark, filter),
          const SizedBox(height: AppSpacing.sm),
          Expanded(
            child: usersAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.primary,
                ),
              ),
              error: (err, _) => _ErrorView(
                message: err is ServerException ? err.message : err.toString(),
                onRetry: () =>
                    ref.read(adminUsersProvider.notifier).refresh(),
              ),
              data: (users) {
                final filtered = _filter(users);
                if (filtered.isEmpty) {
                  return _EmptyView(
                    filter: filter,
                    isSearch: _searchQuery.isNotEmpty,
                    searchQuery: _searchQuery,
                    isDark: isDark,
                  );
                }
                return RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: () =>
                      ref.read(adminUsersProvider.notifier).refresh(),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.xl,
                      AppSpacing.xs,
                      AppSpacing.xl,
                      AppSpacing.xl,
                    ),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AppSpacing.sm),
                    itemBuilder: (context, index) => _UserTile(
                      user: filtered[index],
                      isDark: isDark,
                      onApprove: () async {
                        final ok = await _confirm(
                          'Approve',
                          'Grant access to ${filtered[index].name}?',
                        );
                        if (ok) {
                          ref
                              .read(adminUsersProvider.notifier)
                              .approveUser(filtered[index].id);
                        }
                      },
                      onReject: () async {
                        final ok = await _confirm(
                          'Reject',
                          'Deny access for ${filtered[index].name}?',
                        );
                        if (ok) {
                          ref
                              .read(adminUsersProvider.notifier)
                              .rejectUser(filtered[index].id);
                        }
                      },
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ── Header ──────────────────────────────────────────────────────────────────

  Widget _buildHeader(BuildContext context, bool isDark) {
    final titleColor =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subtitleColor =
        isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl, AppSpacing.xl, AppSpacing.lg, AppSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Team',
                  style: TextStyle(
                    color: titleColor,
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.56,
                    height: 1.14,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'Manage user registrations',
                  style: TextStyle(
                    color: subtitleColor,
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    letterSpacing: -0.12,
                  ),
                ),
              ],
            ),
          ),
          // Refresh — ghost icon button
          _GhostIconButton(
            icon: Icons.refresh_rounded,
            tooltip: 'Refresh',
            isDark: isDark,
            onTap: () => ref.read(adminUsersProvider.notifier).refresh(),
          ),
        ],
      ),
    );
  }

  // ── Search bar ──────────────────────────────────────────────────────────────

  Widget _buildSearchBar(bool isDark) {
    final fillColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final borderColor =
        isDark ? AppColors.borderDark : AppColors.borderLight;
    final hintColor =
        isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;
    final textColor =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      child: Container(
        height: 38,
        decoration: BoxDecoration(
          color: fillColor,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 3),
          border: Border.all(color: borderColor),
        ),
        child: TextField(
          controller: _searchController,
          onChanged: (v) => setState(() => _searchQuery = v),
          style: TextStyle(
            color: textColor,
            fontSize: 13,
            letterSpacing: -0.15,
          ),
          decoration: InputDecoration(
            hintText: 'Search…',
            hintStyle: TextStyle(
              color: hintColor,
              fontSize: 13,
              letterSpacing: -0.12,
            ),
            prefixIcon: Icon(Icons.search_rounded, size: 17, color: hintColor),
            suffixIcon: _searchQuery.isNotEmpty
                ? GestureDetector(
                    onTap: () {
                      _searchController.clear();
                      setState(() => _searchQuery = '');
                    },
                    child: Icon(Icons.close_rounded, size: 15, color: hintColor),
                  )
                : null,
            contentPadding: const EdgeInsets.symmetric(vertical: 8),
            isDense: true,
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
          ),
        ),
      ),
    );
  }

  // ── Filter bar ──────────────────────────────────────────────────────────────

  Widget _buildFilterBar(
      BuildContext context, bool isDark, String? currentFilter) {
    final tabs = [
      (label: 'Pending',  value: 'PENDING',  accent: AppColors.warning),
      (label: 'All',      value: null,        accent: AppColors.primary),
      (label: 'Approved', value: 'APPROVED',  accent: AppColors.success),
      (label: 'Rejected', value: 'REJECTED',  accent: AppColors.error),
    ];

    return SizedBox(
      height: 34,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
        itemCount: tabs.length,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.xs),
        itemBuilder: (_, i) {
          final tab = tabs[i];
          final isSelected = currentFilter == tab.value;
          return _FilterPill(
            label: tab.label,
            isSelected: isSelected,
            accent: tab.accent,
            isDark: isDark,
            onTap: () {
              ref.read(adminUserFilterProvider.notifier).state = tab.value;
              ref.read(adminUsersProvider.notifier).refresh();
            },
          );
        },
      ),
    );
  }
}

// ── Filter pill ───────────────────────────────────────────────────────────────

class _FilterPill extends StatefulWidget {
  const _FilterPill({
    required this.label,
    required this.isSelected,
    required this.accent,
    required this.isDark,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final Color accent;
  final bool isDark;
  final VoidCallback onTap;

  @override
  State<_FilterPill> createState() => _FilterPillState();
}

class _FilterPillState extends State<_FilterPill> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final bg = widget.isSelected
        ? widget.accent
        : _hovered
            ? (widget.isDark ? AppColors.hoverDark : AppColors.hoverLight)
            : Colors.transparent;

    final textColor = widget.isSelected
        ? Colors.white
        : (widget.isDark
            ? AppColors.textSecondaryDark
            : AppColors.textSecondaryLight);

    final borderColor = widget.isSelected
        ? widget.accent
        : (widget.isDark ? AppColors.borderDark : AppColors.borderLight);

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.xs,
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
              fontWeight: widget.isSelected ? FontWeight.w600 : FontWeight.w400,
              letterSpacing: -0.1,
            ),
          ),
        ),
      ),
    );
  }
}

// ── User tile ─────────────────────────────────────────────────────────────────

class _UserTile extends StatelessWidget {
  const _UserTile({
    required this.user,
    required this.isDark,
    this.onApprove,
    this.onReject,
  });

  final AdminUserModel user;
  final bool isDark;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.07) : Colors.white.withOpacity(0.76),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.10) : Colors.white.withOpacity(0.85),
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
        children: [
          UserAvatar(name: user.name, avatarUrl: user.avatarUrl, radius: 20),
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
                    const SizedBox(width: AppSpacing.sm),
                    _StatusBadge(user: user),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  user.email,
                  style: TextStyle(
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight,
                    fontSize: 12,
                    letterSpacing: -0.12,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _ProviderBadge(provider: user.provider, isDark: isDark),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      DateFormat('MMM d, yyyy').format(user.createdAt),
                      style: TextStyle(
                        color: isDark
                            ? AppColors.textTertiaryDark
                            : AppColors.textTertiaryLight,
                        fontSize: 11,
                        letterSpacing: -0.08,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (user.isPending) ...[
            const SizedBox(width: AppSpacing.md),
            _Actions(onApprove: onApprove, onReject: onReject),
          ],
        ],
      ),
        ),
      ),
    );
  }
}

// ── Status badge ──────────────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.user});
  final AdminUserModel user;

  @override
  Widget build(BuildContext context) {
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
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.10),
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.05,
        ),
      ),
    );
  }
}

// ── Provider badge ────────────────────────────────────────────────────────────

class _ProviderBadge extends StatelessWidget {
  const _ProviderBadge({required this.provider, required this.isDark});
  final String provider;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final isGoogle = provider == 'google';
    final color =
        isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          isGoogle ? Icons.account_circle_rounded : Icons.mail_outline_rounded,
          size: 11,
          color: color,
        ),
        const SizedBox(width: 3),
        Text(
          isGoogle ? 'Google' : 'Email',
          style: TextStyle(
            color: color,
            fontSize: 11,
            letterSpacing: -0.08,
          ),
        ),
      ],
    );
  }
}

// ── Action buttons ────────────────────────────────────────────────────────────

class _Actions extends StatelessWidget {
  const _Actions({this.onApprove, this.onReject});
  final VoidCallback? onApprove;
  final VoidCallback? onReject;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _RoundAction(
          icon: Icons.check_rounded,
          color: AppColors.success,
          tooltip: 'Approve',
          onTap: onApprove,
        ),
        const SizedBox(width: AppSpacing.xs),
        _RoundAction(
          icon: Icons.close_rounded,
          color: AppColors.error,
          tooltip: 'Reject',
          onTap: onReject,
        ),
      ],
    );
  }
}

class _RoundAction extends StatefulWidget {
  const _RoundAction({
    required this.icon,
    required this.color,
    required this.tooltip,
    this.onTap,
  });

  final IconData icon;
  final Color color;
  final String tooltip;
  final VoidCallback? onTap;

  @override
  State<_RoundAction> createState() => _RoundActionState();
}

class _RoundActionState extends State<_RoundAction> {
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
            duration: const Duration(milliseconds: 120),
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: _hovered
                  ? widget.color.withOpacity(0.20)
                  : widget.color.withOpacity(0.10),
              shape: BoxShape.circle,
            ),
            child: Icon(widget.icon, color: widget.color, size: 16),
          ),
        ),
      ),
    );
  }
}

// ── Ghost icon button ─────────────────────────────────────────────────────────

class _GhostIconButton extends StatefulWidget {
  const _GhostIconButton({
    required this.icon,
    required this.tooltip,
    required this.isDark,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final bool isDark;
  final VoidCallback onTap;

  @override
  State<_GhostIconButton> createState() => _GhostIconButtonState();
}

class _GhostIconButtonState extends State<_GhostIconButton> {
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
            duration: const Duration(milliseconds: 120),
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: _hovered
                  ? (widget.isDark
                      ? AppColors.hoverDark
                      : AppColors.hoverLight)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: Icon(
              widget.icon,
              size: 18,
              color: widget.isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
        ),
      ),
    );
  }
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

class _ConfirmDialog extends StatelessWidget {
  const _ConfirmDialog({required this.title, required this.body});
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final titleColor =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final bodyColor =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final borderColor = isDark ? AppColors.borderDark : Colors.transparent;

    return Dialog(
      backgroundColor: bg,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        side: BorderSide(color: borderColor),
      ),
      child: Container(
        width: 320,
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                color: titleColor,
                fontSize: 17,
                fontWeight: FontWeight.w600,
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              body,
              style: TextStyle(
                color: bodyColor,
                fontSize: 14,
                letterSpacing: -0.15,
                height: 1.47,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                _DialogButton(
                  label: 'Cancel',
                  isPrimary: false,
                  isDark: isDark,
                  onTap: () => Navigator.pop(context, false),
                ),
                const SizedBox(width: AppSpacing.sm),
                _DialogButton(
                  label: title,
                  isPrimary: true,
                  isDark: isDark,
                  onTap: () => Navigator.pop(context, true),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DialogButton extends StatefulWidget {
  const _DialogButton({
    required this.label,
    required this.isPrimary,
    required this.isDark,
    required this.onTap,
  });

  final String label;
  final bool isPrimary;
  final bool isDark;
  final VoidCallback onTap;

  @override
  State<_DialogButton> createState() => _DialogButtonState();
}

class _DialogButtonState extends State<_DialogButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final bg = widget.isPrimary
        ? (_hovered ? const Color(0xFF0077ED) : AppColors.primary)
        : (_hovered
            ? (widget.isDark ? AppColors.hoverDark : AppColors.hoverLight)
            : Colors.transparent);

    final textColor = widget.isPrimary
        ? Colors.white
        : (widget.isDark
            ? AppColors.textSecondaryDark
            : AppColors.textSecondaryLight);

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.sm,
          ),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
          child: Text(
            widget.label,
            style: TextStyle(
              color: textColor,
              fontSize: 13,
              fontWeight: FontWeight.w500,
              letterSpacing: -0.15,
            ),
          ),
        ),
      ),
    );
  }
}

// ── Error view ────────────────────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Center(
      child: Padding(
        padding: AppSpacing.paddingXl,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded,
                color: AppColors.error.withOpacity(0.6), size: 44),
            const SizedBox(height: AppSpacing.lg),
            Text(
              message,
              style: TextStyle(
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight,
                fontSize: 13,
                letterSpacing: -0.15,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xl),
            GestureDetector(
              onTap: onRetry,
              child: Text(
                'Try again',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  letterSpacing: -0.15,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Empty view ────────────────────────────────────────────────────────────────

class _EmptyView extends StatelessWidget {
  const _EmptyView({
    required this.filter,
    required this.isSearch,
    required this.searchQuery,
    required this.isDark,
  });

  final String? filter;
  final bool isSearch;
  final String searchQuery;
  final bool isDark;

  String get _message {
    if (isSearch) return 'No results for "$searchQuery"';
    switch (filter) {
      case 'PENDING':  return 'No pending registrations';
      case 'APPROVED': return 'No approved users';
      case 'REJECTED': return 'No rejected users';
      default:         return 'No users found';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isSearch
                ? Icons.search_off_rounded
                : Icons.person_off_outlined,
            size: 52,
            color: isDark
                ? AppColors.textTertiaryDark
                : AppColors.textTertiaryLight,
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            _message,
            style: TextStyle(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
              fontSize: 14,
              letterSpacing: -0.2,
            ),
          ),
        ],
      ),
    );
  }
}
