import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';
import 'package:ai_task_manager/features/projects/model/project_entity.dart';
import 'package:intl/intl.dart';

class ProjectCard extends StatefulWidget {
  const ProjectCard({
    super.key,
    required this.project,
    required this.onTap,
    this.onDelete,
    this.onManageMembers,
    this.taskCount = 0,
  });

  final ProjectEntity project;
  final VoidCallback onTap;
  final VoidCallback? onDelete;
  final VoidCallback? onManageMembers;
  final int taskCount;

  @override
  State<ProjectCard> createState() => _ProjectCardState();
}

class _ProjectCardState extends State<ProjectCard> {
  bool _isHovered = false;

  Color get _accentColor {
    if (widget.project.color != null && widget.project.color!.isNotEmpty) {
      try {
        final hex = widget.project.color!.replaceFirst('#', '');
        return Color(int.parse('FF$hex', radix: 16));
      } catch (_) {
        return AppColors.primary;
      }
    }
    return AppColors.primary;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.cardDark : AppColors.cardLight;
    final textPrimary = isDark
        ? AppColors.textPrimaryDark
        : AppColors.textPrimaryLight;
    final textSecondary = isDark
        ? AppColors.textSecondaryDark
        : AppColors.textSecondaryLight;
    final textTertiary = isDark
        ? AppColors.textTertiaryDark
        : AppColors.textTertiaryLight;

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: AnimatedContainer(
          duration: AppConstants.animationDuration,
          curve: Curves.easeInOut,
          decoration: BoxDecoration(
            color: isDark
                ? Colors.white.withOpacity(_isHovered ? 0.11 : 0.07)
                : Colors.white.withOpacity(_isHovered ? 0.88 : 0.74),
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            border: Border.all(
              color: _isHovered
                  ? _accentColor.withOpacity(isDark ? 0.45 : 0.35)
                  : (isDark
                      ? Colors.white.withOpacity(0.10)
                      : Colors.white.withOpacity(0.85)),
              width: 1.0,
            ),
            boxShadow: isDark
                ? [
                    BoxShadow(
                      color: Colors.black
                          .withOpacity(_isHovered ? 0.40 : 0.20),
                      blurRadius: _isHovered ? 24 : 10,
                      offset: Offset(0, _isHovered ? 8 : 3),
                    ),
                  ]
                : [
                    BoxShadow(
                      color: _isHovered
                          ? _accentColor.withOpacity(0.18)
                          : Colors.black.withOpacity(0.07),
                      blurRadius: _isHovered ? 28 : 16,
                      offset: Offset(0, _isHovered ? 10 : 4),
                    ),
                  ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 4,
                decoration: BoxDecoration(
                  color: _accentColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(AppSpacing.radiusLg),
                    topRight: Radius.circular(AppSpacing.radiusLg),
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: _accentColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Text(
                              widget.project.name,
                              style: TextStyle(
                                color: textPrimary,
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                letterSpacing: -0.1,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (_isHovered &&
                              (widget.onDelete != null ||
                                  widget.onManageMembers != null))
                            _ContextMenuButton(
                              isDark: isDark,
                              onDelete: widget.onDelete,
                              onManageMembers: widget.onManageMembers,
                            ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          widget.project.description ?? 'No description',
                          style: TextStyle(
                            color: widget.project.description != null
                                ? textSecondary
                                : textTertiary,
                            fontSize: 13,
                            height: 1.5,
                            fontStyle: widget.project.description != null
                                ? FontStyle.normal
                                : FontStyle.italic,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_today_outlined,
                            size: 12,
                            color: textTertiary,
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          Text(
                            DateFormat(
                              'MMM d, yyyy',
                            ).format(widget.project.createdAt),
                            style: TextStyle(
                              color: textTertiary,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.sm,
                              vertical: AppSpacing.xxs,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? AppColors.surfaceDark
                                  : AppColors.hoverLight,
                              borderRadius: BorderRadius.circular(
                                AppSpacing.radiusSm,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.check_circle_outline_rounded,
                                  size: 12,
                                  color: textTertiary,
                                ),
                                const SizedBox(width: AppSpacing.xs),
                                Text(
                                  '${widget.taskCount} tasks',
                                  style: TextStyle(
                                    color: textTertiary,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
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
}

class _ContextMenuButton extends StatefulWidget {
  const _ContextMenuButton({
    required this.isDark,
    this.onDelete,
    this.onManageMembers,
  });

  final bool isDark;
  final VoidCallback? onDelete;
  final VoidCallback? onManageMembers;

  @override
  State<_ContextMenuButton> createState() => _ContextMenuButtonState();
}

class _ContextMenuButtonState extends State<_ContextMenuButton> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: () {
          _showContextMenu(context);
        },
        child: AnimatedContainer(
          duration: AppConstants.animationDuration,
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: _isHovered
                ? (widget.isDark ? AppColors.hoverDark : AppColors.hoverLight)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          ),
          child: Icon(
            Icons.more_horiz_rounded,
            size: 16,
            color: widget.isDark
                ? AppColors.textSecondaryDark
                : AppColors.textSecondaryLight,
          ),
        ),
      ),
    );
  }

  void _showContextMenu(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final button = context.findRenderObject()! as RenderBox;
    final overlay = Navigator.of(context).overlay!.context.findRenderObject()! as RenderBox;
    final position = RelativeRect.fromRect(
      Rect.fromPoints(
        button.localToGlobal(Offset.zero, ancestor: overlay),
        button.localToGlobal(button.size.bottomRight(Offset.zero), ancestor: overlay),
      ),
      Offset.zero & overlay.size,
    );

    showMenu<String>(
      context: context,
      position: position,
      color: isDark ? const Color(0xFF1D1D1F) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        side: BorderSide(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
        ),
      ),
      items: [
        if (widget.onManageMembers != null)
          PopupMenuItem(
            value: 'members',
            child: Row(
              children: [
                Icon(
                  Icons.group_rounded,
                  size: 16,
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                ),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  'Gérer les membres',
                  style: TextStyle(
                    color: isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        if (widget.onDelete != null)
          PopupMenuItem(
            value: 'delete',
            child: Row(
              children: [
                const Icon(
                  Icons.delete_outline_rounded,
                  size: 16,
                  color: AppColors.error,
                ),
                const SizedBox(width: AppSpacing.sm),
                const Text(
                  'Delete Project',
                  style: TextStyle(
                    color: AppColors.error,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
      ],
    ).then((value) {
      if (value == 'delete') widget.onDelete?.call();
      if (value == 'members') widget.onManageMembers?.call();
    });
  }
}
