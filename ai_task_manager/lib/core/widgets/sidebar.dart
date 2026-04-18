import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';
import 'package:ai_task_manager/shared/user_avatar.dart';

class SidebarItem {
  final IconData icon;
  final String label;
  final String route;
  final bool showBadge;
  final int? badgeCount;

  const SidebarItem({
    required this.icon,
    required this.label,
    required this.route,
    this.showBadge = false,
    this.badgeCount,
  });
}

class AppSidebar extends StatefulWidget {
  final int selectedIndex;
  final List<SidebarItem> items;
  final ValueChanged<int> onItemSelected;
  final bool isCollapsed;
  final VoidCallback onToggleCollapse;
  final String userName;
  final String? userAvatarUrl;
  final VoidCallback onLogout;

  const AppSidebar({
    super.key,
    required this.selectedIndex,
    required this.items,
    required this.onItemSelected,
    this.isCollapsed = false,
    required this.onToggleCollapse,
    required this.userName,
    this.userAvatarUrl,
    required this.onLogout,
  });

  @override
  State<AppSidebar> createState() => _AppSidebarState();
}

class _AppSidebarState extends State<AppSidebar> {
  int _hoveredIndex = -1;
  bool _logoutHovered = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final sidebarWidth = widget.isCollapsed
        ? AppConstants.sidebarCollapsedWidth
        : AppConstants.sidebarWidth;

    return AnimatedContainer(
      duration: AppConstants.animationDuration,
      curve: Curves.easeInOut,
      width: sidebarWidth,
      child: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF000000).withOpacity(0.72)
                  : Colors.white.withOpacity(0.72),
              border: Border(
                right: BorderSide(
                  color: isDark
                      ? Colors.white.withOpacity(0.08)
                      : Colors.black.withOpacity(0.07),
                  width: 1,
                ),
              ),
            ),
            child: Column(
        children: [
          _buildHeader(context, isDark),
          const SizedBox(height: AppSpacing.xs),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
                vertical: AppSpacing.xs,
              ),
              itemCount: widget.items.length,
              itemBuilder: (context, index) => _buildNavItem(
                context,
                index,
                widget.items[index],
                isDark,
              ),
            ),
          ),
          _buildUserSection(context, isDark),
          _buildCollapseButton(isDark),
        ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, bool isDark) {
    final logoColor = AppColors.primary;
    final titleColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;

    final logo = Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        color: logoColor,
        borderRadius: BorderRadius.circular(7),
      ),
      child: const Center(
        child: Text(
          'A',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontSize: 15,
            letterSpacing: -0.3,
          ),
        ),
      ),
    );

    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      alignment: widget.isCollapsed ? Alignment.center : Alignment.centerLeft,
      child: widget.isCollapsed
          ? logo
          : Row(
              children: [
                logo,
                const SizedBox(width: AppSpacing.md),
                Text(
                  'AI Tasks',
                  style: TextStyle(
                    color: titleColor,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.3,
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildNavItem(
    BuildContext context,
    int index,
    SidebarItem item,
    bool isDark,
  ) {
    final isSelected = widget.selectedIndex == index;
    final isHovered = _hoveredIndex == index;

    // Apple-style: selected = very subtle blue tint; hover = light gray
    Color bgColor;
    if (isSelected) {
      bgColor = isDark
          ? AppColors.primary.withOpacity(0.14)
          : AppColors.primary.withOpacity(0.08);
    } else if (isHovered) {
      bgColor = isDark ? AppColors.hoverDark : AppColors.hoverLight;
    } else {
      bgColor = Colors.transparent;
    }

    final iconColor = isSelected
        ? AppColors.primary
        : (isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight);

    final textColor = isSelected
        ? AppColors.primary
        : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight);

    return Padding(
      padding: const EdgeInsets.only(bottom: 1),
      child: MouseRegion(
        onEnter: (_) => setState(() => _hoveredIndex = index),
        onExit: (_) => setState(() => _hoveredIndex = -1),
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          onTap: () => widget.onItemSelected(index),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 120),
            padding: EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm + 1,
            ),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: widget.isCollapsed
                ? Center(
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Icon(item.icon, size: 19, color: iconColor),
                        if (item.badgeCount != null && item.badgeCount! > 0)
                          Positioned(
                            top: -4,
                            right: -6,
                            child: _Badge(count: item.badgeCount!),
                          )
                        else if (item.showBadge)
                          Positioned(
                            top: -2,
                            right: -2,
                            child: Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: AppColors.error,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                      ],
                    ),
                  )
                : Row(
                    children: [
                      Icon(item.icon, size: 19, color: iconColor),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Text(
                          item.label,
                          style: TextStyle(
                            color: textColor,
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            letterSpacing: -0.15,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (item.badgeCount != null && item.badgeCount! > 0)
                        _Badge(count: item.badgeCount!)
                      else if (item.showBadge)
                        Container(
                          width: 7,
                          height: 7,
                          decoration: const BoxDecoration(
                            color: AppColors.error,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildUserSection(BuildContext context, bool isDark) {
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final nameColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Container(
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: borderColor)),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.sm,
      ),
      child: widget.isCollapsed
          ? Center(
              child: UserAvatar(
                name: widget.userName,
                avatarUrl: widget.userAvatarUrl,
                radius: 15,
              ),
            )
          : Row(
              children: [
                UserAvatar(
                  name: widget.userName,
                  avatarUrl: widget.userAvatarUrl,
                  radius: 15,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    widget.userName,
                    style: TextStyle(
                      color: nameColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      letterSpacing: -0.12,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                MouseRegion(
                  cursor: SystemMouseCursors.click,
                  onEnter: (_) => setState(() => _logoutHovered = true),
                  onExit: (_) => setState(() => _logoutHovered = false),
                  child: GestureDetector(
                    onTap: widget.onLogout,
                    child: Tooltip(
                      message: 'Se déconnecter',
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 120),
                        padding: const EdgeInsets.all(AppSpacing.xs),
                        decoration: BoxDecoration(
                          color: _logoutHovered
                              ? (isDark ? AppColors.hoverDark : AppColors.hoverLight)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                        ),
                        child: Icon(
                          Icons.logout_rounded,
                          size: 15,
                          color: _logoutHovered
                              ? AppColors.error
                              : (isDark
                                  ? AppColors.textTertiaryDark
                                  : AppColors.textTertiaryLight),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildCollapseButton(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.sm),
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          onTap: widget.onToggleCollapse,
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: Icon(
              widget.isCollapsed
                  ? Icons.chevron_right_rounded
                  : Icons.chevron_left_rounded,
              size: 18,
              color: isDark
                  ? AppColors.textTertiaryDark
                  : AppColors.textTertiaryLight,
            ),
          ),
        ),
      ),
    );
  }
}

// ── Badge ─────────────────────────────────────────────────────────────────────

class _Badge extends StatelessWidget {
  const _Badge({required this.count});
  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
      decoration: BoxDecoration(
        color: AppColors.error,
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
      child: Text(
        count > 99 ? '99+' : '$count',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w600,
          height: 1.3,
          letterSpacing: 0,
        ),
      ),
    );
  }
}
