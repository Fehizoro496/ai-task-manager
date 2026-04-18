import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/core/design_system/app_button.dart';
import 'package:ai_task_manager/core/design_system/kanban_column.dart';
import 'package:ai_task_manager/core/design_system/task_card.dart' as ds;
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';
import 'package:ai_task_manager/features/board/model/board_column_entity.dart';
import 'package:ai_task_manager/features/board/viewmodel/board_viewmodel.dart';
import 'package:ai_task_manager/features/board/view/add_task_inline.dart';
import 'package:ai_task_manager/features/board/view/task_detail_panel.dart';
import 'package:ai_task_manager/features/tasks/model/task_entity.dart';
import 'package:ai_task_manager/features/tasks/viewmodel/task_viewmodel.dart';

class BoardScreen extends ConsumerStatefulWidget {
  const BoardScreen({
    super.key,
    required this.projectId,
    this.projectName = 'Project Board',
    this.highlightTaskId,
  });

  final String projectId;
  final String projectName;
  final String? highlightTaskId;

  @override
  ConsumerState<BoardScreen> createState() => _BoardScreenState();
}

class _BoardScreenState extends ConsumerState<BoardScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  TaskPriority? _priorityFilter;
  String? _activeHighlightId;

  @override
  void initState() {
    super.initState();
    _activeHighlightId = widget.highlightTaskId;
    if (_activeHighlightId != null) {
      // Clear after animation completes (3 pulses × 700 ms + 400 ms fade-out)
      Future.delayed(const Duration(milliseconds: 5000), () {
        if (mounted) setState(() => _activeHighlightId = null);
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final columns = ref.watch(boardColumnsProvider);
    final boardState = ref.watch(boardTasksProvider(widget.projectId));
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Open dialog when a task is selected
    ref.listen<TaskEntity?>(selectedTaskProvider, (previous, next) {
      if (next != null && previous == null) {
        showTaskDetailDialog(
          context,
          task: next,
          projectId: widget.projectId,
        );
      }
    });

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Board content starts from y=0, will be visible through glass top bar
          Positioned.fill(
            top: 64,
            child: boardState.when(
              loading: () => _BoardSkeleton(
                columns: columns,
                isDark: isDark,
              ),
              error: (error, _) => _BoardError(
                message: error.toString(),
                onRetry: () => ref
                    .read(boardTasksProvider(widget.projectId).notifier)
                    .loadTasks(),
              ),
              data: (tasks) {
                final filtered = _applyFilters(tasks);
                final currentUser = ref.watch(authStateProvider).valueOrNull;
                final isAdmin = currentUser?.isAdmin ?? false;
                final currentUserId = currentUser?.id ?? '';
                return _BoardContent(
                  projectId: widget.projectId,
                  columns: columns,
                  tasks: filtered,
                  isDark: isDark,
                  isAdmin: isAdmin,
                  currentUserId: currentUserId,
                  highlightTaskId: _activeHighlightId,
                );
              },
            ),
          ),
          // Glass top bar floating over board content
          Positioned(
            top: 0, left: 0, right: 0,
            child: _TopBar(
              projectName: widget.projectName,
              searchController: _searchController,
              priorityFilter: _priorityFilter,
              isDark: isDark,
              onSearchChanged: (value) => setState(() => _searchQuery = value),
              onPriorityFilterChanged: (value) =>
                  setState(() => _priorityFilter = value),
            ),
          ),
        ],
      ),
    );
  }

  List<TaskEntity> _applyFilters(List<TaskEntity> tasks) {
    var filtered = tasks;

    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filtered = filtered
          .where((t) =>
              t.title.toLowerCase().contains(query) ||
              (t.description?.toLowerCase().contains(query) ?? false))
          .toList();
    }

    if (_priorityFilter != null) {
      filtered =
          filtered.where((t) => t.priority == _priorityFilter).toList();
    }

    return filtered;
  }
}

// =============================================================================
// Top Bar
// =============================================================================

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.projectName,
    required this.searchController,
    required this.priorityFilter,
    required this.isDark,
    required this.onSearchChanged,
    required this.onPriorityFilterChanged,
  });

  final String projectName;
  final TextEditingController searchController;
  final TaskPriority? priorityFilter;
  final bool isDark;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<TaskPriority?> onPriorityFilterChanged;

  @override
  Widget build(BuildContext context) {
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final surfaceColor =
        isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final titleColor =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final hintColor =
        isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF000000).withOpacity(0.72)
            : Colors.white.withOpacity(0.72),
        border: Border(
          bottom: BorderSide(
            color: isDark
                ? Colors.white.withOpacity(0.08)
                : Colors.black.withOpacity(0.07),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Text(
            projectName,
            style: TextStyle(
              color: titleColor,
              fontSize: 18,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(width: AppSpacing.xxl),
          SizedBox(
            width: 260,
            height: 36,
            child: TextField(
              controller: searchController,
              onChanged: onSearchChanged,
              style: TextStyle(color: titleColor, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Search tasks...',
                hintStyle: TextStyle(color: hintColor, fontSize: 13),
                prefixIcon: Icon(Icons.search_rounded,
                    size: 18, color: hintColor),
                filled: true,
                fillColor: isDark
                    ? Colors.white.withOpacity(0.08)
                    : Colors.black.withOpacity(0.04),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  borderSide: BorderSide(color: borderColor),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  borderSide: BorderSide(color: borderColor),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  borderSide:
                      const BorderSide(color: AppColors.primary, width: 1.5),
                ),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          ..._buildFilterChips(),
          const Spacer(),
        ],
        ),
        ),
      ),
    );
  }

  List<Widget> _buildFilterChips() {
    return [
      _FilterChip(
        label: 'All',
        isSelected: priorityFilter == null,
        isDark: isDark,
        onTap: () => onPriorityFilterChanged(null),
      ),
      const SizedBox(width: AppSpacing.xs),
      _FilterChip(
        label: 'Urgent',
        isSelected: priorityFilter == TaskPriority.urgent,
        activeColor: AppColors.priorityUrgent,
        isDark: isDark,
        onTap: () => onPriorityFilterChanged(
          priorityFilter == TaskPriority.urgent ? null : TaskPriority.urgent,
        ),
      ),
      const SizedBox(width: AppSpacing.xs),
      _FilterChip(
        label: 'High',
        isSelected: priorityFilter == TaskPriority.high,
        activeColor: AppColors.priorityHigh,
        isDark: isDark,
        onTap: () => onPriorityFilterChanged(
          priorityFilter == TaskPriority.high ? null : TaskPriority.high,
        ),
      ),
      const SizedBox(width: AppSpacing.xs),
      _FilterChip(
        label: 'Medium',
        isSelected: priorityFilter == TaskPriority.medium,
        activeColor: AppColors.priorityMedium,
        isDark: isDark,
        onTap: () => onPriorityFilterChanged(
          priorityFilter == TaskPriority.medium ? null : TaskPriority.medium,
        ),
      ),
      const SizedBox(width: AppSpacing.xs),
      _FilterChip(
        label: 'Low',
        isSelected: priorityFilter == TaskPriority.low,
        activeColor: AppColors.priorityLow,
        isDark: isDark,
        onTap: () => onPriorityFilterChanged(
          priorityFilter == TaskPriority.low ? null : TaskPriority.low,
        ),
      ),
    ];
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.isDark,
    required this.onTap,
    this.activeColor,
  });

  final String label;
  final bool isSelected;
  final bool isDark;
  final VoidCallback onTap;
  final Color? activeColor;

  @override
  Widget build(BuildContext context) {
    final effectiveColor = activeColor ?? AppColors.primary;

    return GestureDetector(
      onTap: onTap,
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: AnimatedContainer(
          duration: AppConstants.animationDuration,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.xs,
          ),
          decoration: BoxDecoration(
            color: isSelected
                ? effectiveColor.withOpacity(0.12)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            border: Border.all(
              color: isSelected
                  ? effectiveColor.withOpacity(0.4)
                  : (isDark ? AppColors.borderDark : AppColors.borderLight),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected
                  ? effectiveColor
                  : (isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight),
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Board Content
// =============================================================================

class _BoardContent extends ConsumerStatefulWidget {
  const _BoardContent({
    required this.projectId,
    required this.columns,
    required this.tasks,
    required this.isDark,
    required this.isAdmin,
    required this.currentUserId,
    this.highlightTaskId,
  });

  final String projectId;
  final List<BoardColumnEntity> columns;
  final List<TaskEntity> tasks;
  final bool isDark;
  final bool isAdmin;
  final String currentUserId;
  final String? highlightTaskId;

  @override
  ConsumerState<_BoardContent> createState() => _BoardContentState();
}

class _BoardContentState extends ConsumerState<_BoardContent> {
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  List<TaskEntity> _tasksForStatus(TaskStatus status) {
    return widget.tasks.where((t) => t.status == status).toList()
      ..sort((a, b) => a.order.compareTo(b.order));
  }

  @override
  Widget build(BuildContext context) {
    return _FloatingScrollbar(
      controller: _scrollController,
      isDark: widget.isDark,
      child: SingleChildScrollView(
        controller: _scrollController,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: widget.columns.asMap().entries.map((entry) {
            final index = entry.key;
            final column = entry.value;
            final columnTasks = _tasksForStatus(column.status);

            return Padding(
              padding: EdgeInsets.only(
                right: index < widget.columns.length - 1 ? AppSpacing.lg : 0,
              ),
              child: _DragTargetColumn(
                projectId: widget.projectId,
                column: column,
                tasks: columnTasks,
                isDark: widget.isDark,
                isAdmin: widget.isAdmin,
                currentUserId: widget.currentUserId,
                highlightTaskId: widget.highlightTaskId,
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

// =============================================================================
// Drag Target Column
// =============================================================================

class _DragTargetColumn extends ConsumerStatefulWidget {
  const _DragTargetColumn({
    required this.projectId,
    required this.column,
    required this.tasks,
    required this.isDark,
    required this.isAdmin,
    required this.currentUserId,
    this.highlightTaskId,
  });

  final String projectId;
  final BoardColumnEntity column;
  final List<TaskEntity> tasks;
  final bool isDark;
  final bool isAdmin;
  final String currentUserId;
  final String? highlightTaskId;

  @override
  ConsumerState<_DragTargetColumn> createState() => _DragTargetColumnState();
}

class _DragTargetColumnState extends ConsumerState<_DragTargetColumn> {
  bool _isDragOver = false;
  bool _showAddTask = false;

  @override
  Widget build(BuildContext context) {
    final column = DragTarget<TaskEntity>(
      onWillAcceptWithDetails: (details) {
        final task = details.data;
        if (!widget.isAdmin && task.assigneeId != widget.currentUserId) {
          return false;
        }
        if (task.status != widget.column.status) {
          setState(() => _isDragOver = true);
          return true;
        }
        return false;
      },
      onLeave: (_) => setState(() => _isDragOver = false),
      onAcceptWithDetails: (details) {
        setState(() => _isDragOver = false);
        final task = details.data;
        ref.read(boardTasksProvider(widget.projectId).notifier).moveTask(
              taskId: task.id,
              newStatus: widget.column.status,
              newOrder: widget.tasks.length,
            );
      },
      builder: (context, candidateData, rejectedData) {
        return AnimatedContainer(
          duration: AppConstants.animationDuration,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            border: _isDragOver
                ? Border.all(
                    color: widget.column.color.withOpacity(0.5),
                    width: 2,
                  )
                : null,
          ),
          child: SizedBox(
            height: MediaQuery.of(context).size.height - 140,
            child: KanbanColumn(
              title: widget.column.title,
              color: widget.column.color,
              taskCount: widget.tasks.length,
              onAddTask: widget.isAdmin
                  ? () => setState(() => _showAddTask = !_showAddTask)
                  : null,
              children: [
                ...widget.tasks.asMap().entries.map((entry) {
                  final task = entry.value;
                  return _DraggableTaskCard(
                    task: task,
                    index: entry.key,
                    isAdmin: widget.isAdmin,
                    currentUserId: widget.currentUserId,
                    isHighlighted: task.id == widget.highlightTaskId,
                  );
                }),
                if (_isDragOver && candidateData.isNotEmpty)
                  _DragPlaceholder(isDark: widget.isDark),
                if (_showAddTask)
                  AddTaskInline(
                    projectId: widget.projectId,
                    status: widget.column.status,
                    onClose: () => setState(() => _showAddTask = false),
                  ),
              ],
            ),
          ),
        );
      },
    );
    return column;
  }
}

// =============================================================================
// Draggable Task Card
// =============================================================================

class _DraggableTaskCard extends ConsumerWidget {
  const _DraggableTaskCard({
    required this.task,
    required this.index,
    required this.isAdmin,
    required this.currentUserId,
    this.isHighlighted = false,
  });

  final TaskEntity task;
  final int index;
  final bool isAdmin;
  final String currentUserId;
  final bool isHighlighted;

  ds.TaskPriority _mapPriority(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.urgent:
        return ds.TaskPriority.urgent;
      case TaskPriority.high:
        return ds.TaskPriority.high;
      case TaskPriority.medium:
        return ds.TaskPriority.medium;
      case TaskPriority.low:
        return ds.TaskPriority.low;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cardWidth = AppConstants.kanbanColumnWidth - AppSpacing.lg * 2;

    Widget buildCard() {
      final card = ds.TaskCard(
        title: task.title,
        identifier: task.identifier,
        description: task.description,
        priority: _mapPriority(task.priority),
        assigneeName: task.assigneeName,
        assigneeAvatar: task.assigneeAvatar,
        labels: task.labels,
        dueDate: task.dueDate,
        onTap: () {
          ref.read(selectedTaskProvider.notifier).state = task;
        },
      );
      if (!isHighlighted) return card;
      return Stack(
        clipBehavior: Clip.none,
        children: [
          card,
          Positioned.fill(child: _HighlightBorder()),
        ],
      );
    }

    final canDrag = isAdmin || task.assigneeId == currentUserId;

    final draggable = canDrag
        ? Draggable<TaskEntity>(
            data: task,
            feedback: Material(
              elevation: 8,
              borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              child: SizedBox(
                width: cardWidth,
                child: Opacity(opacity: 0.9, child: buildCard()),
              ),
            ),
            childWhenDragging: Opacity(
              opacity: 0.3,
              child: buildCard(),
            ),
            child: buildCard(),
          )
        : buildCard();

    return draggable
        .animate()
        .fadeIn(
          duration: const Duration(milliseconds: 300),
          delay: Duration(milliseconds: 50 * index),
        )
        .slideY(
          begin: 0.1,
          end: 0,
          duration: const Duration(milliseconds: 300),
          delay: Duration(milliseconds: 50 * index),
          curve: Curves.easeOutCubic,
        );
  }
}

// =============================================================================
// Highlight Border (pulsing outline for deep-linked tasks)
// =============================================================================

class _HighlightBorder extends StatefulWidget {
  const _HighlightBorder();

  @override
  State<_HighlightBorder> createState() => _HighlightBorderState();
}

class _HighlightBorderState extends State<_HighlightBorder>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    )..repeat(reverse: true);

    // Stop pulsing after 3 cycles (~4.2 s) then fade out
    Future.delayed(const Duration(milliseconds: 4200), () {
      if (mounted) {
        _ctrl.animateTo(0, duration: const Duration(milliseconds: 400));
      }
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _ctrl,
        builder: (context, child) => DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            border: Border.all(
              color: AppColors.warning
                  .withValues(alpha: 0.4 + _ctrl.value * 0.6),
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.warning
                    .withValues(alpha: _ctrl.value * 0.28),
                blurRadius: 12,
                spreadRadius: 2,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Drag Placeholder
// =============================================================================

class _DragPlaceholder extends StatelessWidget {
  const _DragPlaceholder({required this.isDark});

  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: AppConstants.taskCardMinHeight,
      decoration: BoxDecoration(
        color: (isDark ? AppColors.primary : AppColors.primary)
            .withOpacity(0.08),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(
          color: AppColors.primary.withOpacity(0.3),
          width: 1.5,
          strokeAlign: BorderSide.strokeAlignInside,
        ),
      ),
    )
        .animate(onPlay: (controller) => controller.repeat(reverse: true))
        .shimmer(
          duration: const Duration(milliseconds: 1200),
          color: AppColors.primary.withOpacity(0.05),
        );
  }
}

// =============================================================================
// Loading Skeleton
// =============================================================================

class _BoardSkeleton extends StatefulWidget {
  const _BoardSkeleton({
    required this.columns,
    required this.isDark,
  });

  final List<BoardColumnEntity> columns;
  final bool isDark;

  @override
  State<_BoardSkeleton> createState() => _BoardSkeletonState();
}

class _BoardSkeletonState extends State<_BoardSkeleton> {
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _FloatingScrollbar(
      controller: _scrollController,
      isDark: widget.isDark,
      child: SingleChildScrollView(
        controller: _scrollController,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: widget.columns.asMap().entries.map((entry) {
            final index = entry.key;
            final column = entry.value;

            return Padding(
              padding: EdgeInsets.only(
                right: index < widget.columns.length - 1 ? AppSpacing.lg : 0,
              ),
              child: SizedBox(
                height: MediaQuery.of(context).size.height - 140,
                child: KanbanColumn(
                  title: column.title,
                  color: column.color,
                  taskCount: 0,
                  children: List.generate(3, (i) {
                    return _SkeletonCard(isDark: widget.isDark, index: i);
                  }),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard({
    required this.isDark,
    required this.index,
  });

  final bool isDark;
  final int index;

  @override
  Widget build(BuildContext context) {
    final baseColor = isDark ? AppColors.cardDark : AppColors.cardLight;
    final shimmerColor = isDark ? AppColors.hoverDark : AppColors.hoverLight;

    return Container(
      height: AppConstants.taskCardMinHeight,
      decoration: BoxDecoration(
        color: baseColor,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: isDark ? Border.all(color: AppColors.borderDark) : null,
        boxShadow: isDark ? null : [
          const BoxShadow(
            color: Color(0x18000000),
            blurRadius: 12,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 50,
              height: 14,
              decoration: BoxDecoration(
                color: shimmerColor,
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Container(
              width: double.infinity,
              height: 12,
              decoration: BoxDecoration(
                color: shimmerColor,
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
            ),
            const SizedBox(height: AppSpacing.xxs),
            Container(
              width: 140,
              height: 12,
              decoration: BoxDecoration(
                color: shimmerColor,
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
            ),
          ],
        ),
      ),
    )
        .animate(onPlay: (controller) => controller.repeat(reverse: true))
        .shimmer(
          duration: const Duration(milliseconds: 1500),
          delay: Duration(milliseconds: 200 * index),
          color: shimmerColor.withOpacity(0.3),
        );
  }
}

// =============================================================================
// Floating Scrollbar
// =============================================================================

class _FloatingScrollbar extends StatefulWidget {
  const _FloatingScrollbar({
    required this.controller,
    required this.isDark,
    required this.child,
  });

  final ScrollController controller;
  final bool isDark;
  final Widget child;

  @override
  State<_FloatingScrollbar> createState() => _FloatingScrollbarState();
}

class _FloatingScrollbarState extends State<_FloatingScrollbar> {
  Timer? _activeTimer;

  double _scrollFraction = 0;
  double _thumbFraction = 1;
  bool _hasOverflow = false;
  bool _isActive = false; // scrolling or hovering
  bool _isDragging = false;
  bool _isHovered = false;

  // Drag tracking
  double _trackWidth = 0;
  double _dragStartLocalX = 0;
  double _dragStartScrollPixels = 0;

  double get _thumbWidth => (_trackWidth * _thumbFraction).clamp(40.0, _trackWidth);
  double get _thumbOffset => (_trackWidth - _thumbWidth) * _scrollFraction;

  // Idle: translucent but always visible; active/hover: fully opaque
  double get _opacity {
    if (!_hasOverflow) return 0.0;
    if (_isDragging || _isActive || _isHovered) return 1.0;
    return 0.38;
  }

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => _onScroll());
  }

  @override
  void dispose() {
    _activeTimer?.cancel();
    widget.controller.removeListener(_onScroll);
    super.dispose();
  }

  void _onScroll() {
    if (!widget.controller.hasClients) return;
    final pos = widget.controller.position;
    if (!pos.hasContentDimensions) return;

    final max = pos.maxScrollExtent;
    final viewport = pos.viewportDimension;
    final content = max + viewport;

    setState(() {
      _hasOverflow = max > 0;
      _scrollFraction = max > 0 ? (pos.pixels / max).clamp(0.0, 1.0) : 0.0;
      _thumbFraction = content > 0 ? (viewport / content).clamp(0.1, 1.0) : 1.0;
      _isActive = true;
    });

    _activeTimer?.cancel();
    _activeTimer = Timer(const Duration(milliseconds: 1000), () {
      if (mounted) setState(() => _isActive = false);
    });
  }

  void _onDragStart(DragStartDetails d) {
    setState(() {
      _isDragging = true;
      _dragStartLocalX = d.localPosition.dx;
      _dragStartScrollPixels = widget.controller.offset;
    });
  }

  void _onDragUpdate(DragUpdateDetails d) {
    if (!_isDragging) return;
    final usable = _trackWidth - _thumbWidth;
    if (usable <= 0) return;
    final delta = d.localPosition.dx - _dragStartLocalX;
    final max = widget.controller.position.maxScrollExtent;
    final newOffset = (_dragStartScrollPixels + delta / usable * max).clamp(0.0, max);
    widget.controller.jumpTo(newOffset);
  }

  void _onDragEnd(DragEndDetails d) => setState(() => _isDragging = false);

  void _onTapUp(TapUpDetails d) {
    // Tap outside the thumb → jump scroll to that position
    final tapX = d.localPosition.dx;
    if (tapX < _thumbOffset || tapX > _thumbOffset + _thumbWidth) {
      final usable = _trackWidth - _thumbWidth;
      if (usable <= 0) return;
      final ratio = ((tapX - _thumbWidth / 2) / usable).clamp(0.0, 1.0);
      widget.controller.animateTo(
        ratio * widget.controller.position.maxScrollExtent,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    const hPad = AppSpacing.xl;
    const barHeight = 6.0;
    const hitHeight = 24.0; // larger touch/click target

    return LayoutBuilder(
      builder: (context, constraints) {
        _trackWidth = constraints.maxWidth - hPad * 2;

        return MouseRegion(
          onEnter: (_) => setState(() => _isHovered = true),
          onExit: (_) => setState(() => _isHovered = false),
          child: Stack(
            children: [
              widget.child,
              if (_hasOverflow)
                Positioned(
                  left: hPad,
                  right: hPad,
                  bottom: 10,
                  height: hitHeight,
                  child: GestureDetector(
                    behavior: HitTestBehavior.translucent,
                    onHorizontalDragStart: _onDragStart,
                    onHorizontalDragUpdate: _onDragUpdate,
                    onHorizontalDragEnd: _onDragEnd,
                    onTapUp: _onTapUp,
                    child: AnimatedOpacity(
                      opacity: _opacity,
                      duration: const Duration(milliseconds: 180),
                      child: Center(
                        child: SizedBox(
                          height: barHeight,
                          child: Stack(
                            children: [
                              // Track
                              Positioned.fill(
                                child: DecoratedBox(
                                  decoration: BoxDecoration(
                                    color: widget.isDark
                                        ? Colors.white.withOpacity(0.09)
                                        : Colors.black.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(99),
                                  ),
                                ),
                              ),
                              // Thumb
                              Positioned(
                                left: _thumbOffset,
                                width: _thumbWidth,
                                top: 0,
                                bottom: 0,
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 120),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withOpacity(
                                      _isDragging ? 0.85 : 0.6,
                                    ),
                                    borderRadius: BorderRadius.circular(99),
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppColors.primary.withOpacity(0.3),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
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
                ),
            ],
          ),
        );
      },
    );
  }
}

// =============================================================================
// Board Error
// =============================================================================

class _BoardError extends StatelessWidget {
  const _BoardError({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.error_outline_rounded,
            size: 48,
            color: AppColors.error.withOpacity(0.7),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Failed to load tasks',
            style: TextStyle(
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            message,
            style: TextStyle(color: textColor, fontSize: 13),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xl),
          AppButton(
            label: 'Retry',
            icon: Icons.refresh_rounded,
            onPressed: onRetry,
            variant: AppButtonVariant.secondary,
            size: AppButtonSize.sm,
          ),
        ],
      ),
    );
  }
}
