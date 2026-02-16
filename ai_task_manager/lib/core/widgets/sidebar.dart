import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';

class SidebarItem {
  final IconData icon;
  final String label;
  final String route;
  final bool showBadge;

  const SidebarItem({
    required this.icon,
    required this.label,
    required this.route,
    this.showBadge = false,
  });
}

class AppSidebar extends StatefulWidget {
  final int selectedIndex;
  final List<SidebarItem> items;
  final ValueChanged<int> onItemSelected;
  final bool isCollapsed;
  final VoidCallback onToggleCollapse;

  const AppSidebar({
    super.key,
    required this.selectedIndex,
    required this.items,
    required this.onItemSelected,
    this.isCollapsed = false,
    required this.onToggleCollapse,
  });

  @override
  State<AppSidebar> createState() => _AppSidebarState();
}

class _AppSidebarState extends State<AppSidebar> {
  int _hoveredIndex = -1;

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
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        border: Border(
          right: BorderSide(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
            width: 1,
          ),
        ),
      ),
      child: Column(
        children: [
          _buildHeader(isDark),
          const SizedBox(height: AppSpacing.sm),
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
          _buildCollapseButton(isDark),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      alignment: widget.isCollapsed ? Alignment.center : Alignment.centerLeft,
      child: widget.isCollapsed
          ? Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              ),
              child: const Center(
                child: Text(
                  'A',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ),
            )
          : Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  ),
                  child: const Center(
                    child: Text(
                      'A',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Text(
                  'AI Tasks',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
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

    Color bgColor;
    if (isSelected) {
      bgColor = AppColors.primarySurface;
    } else if (isHovered) {
      bgColor = isDark ? AppColors.hoverDark : AppColors.hoverLight;
    } else {
      bgColor = Colors.transparent;
    }

    final iconColor = isSelected
        ? AppColors.primary
        : isDark
            ? AppColors.textSecondaryDark
            : AppColors.textSecondaryLight;

    final textColor = isSelected
        ? AppColors.primary
        : isDark
            ? AppColors.textPrimaryDark
            : AppColors.textPrimaryLight;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xxs),
      child: MouseRegion(
        onEnter: (_) => setState(() => _hoveredIndex = index),
        onExit: (_) => setState(() => _hoveredIndex = -1),
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          onTap: () => widget.onItemSelected(index),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: EdgeInsets.symmetric(
              horizontal: widget.isCollapsed ? AppSpacing.md : AppSpacing.md,
              vertical: AppSpacing.sm + 2,
            ),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: widget.isCollapsed
                ? Center(
                    child: Icon(item.icon, size: 20, color: iconColor),
                  )
                : Row(
                    children: [
                      Icon(item.icon, size: 20, color: iconColor),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Text(
                          item.label,
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: textColor,
                                    fontWeight: isSelected
                                        ? FontWeight.w600
                                        : FontWeight.w400,
                                  ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (item.showBadge)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.accent,
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

  Widget _buildCollapseButton(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          onTap: widget.onToggleCollapse,
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: Icon(
              widget.isCollapsed
                  ? Icons.chevron_right_rounded
                  : Icons.chevron_left_rounded,
              size: 20,
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
