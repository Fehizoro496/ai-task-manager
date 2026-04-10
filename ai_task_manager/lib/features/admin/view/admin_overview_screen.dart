import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:ai_task_manager/core/design_system/loading_skeleton.dart';
import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/admin/viewmodel/admin_viewmodel.dart';
import 'package:ai_task_manager/features/projects/model/project_entity.dart';
import 'package:ai_task_manager/features/tasks/model/task_entity.dart';

// ─── Task status helpers ──────────────────────────────────────────────────────

const _statusColors = {
  TaskStatus.todo: AppColors.kanbanTodo,
  TaskStatus.inProgress: AppColors.kanbanInProgress,
  TaskStatus.inReview: AppColors.kanbanReview,
  TaskStatus.done: AppColors.kanbanDone,
};

const _statusLabels = {
  TaskStatus.todo: 'Todo',
  TaskStatus.inProgress: 'In Progress',
  TaskStatus.inReview: 'In Review',
  TaskStatus.done: 'Done',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

class AdminOverviewScreen extends ConsumerWidget {
  const AdminOverviewScreen({super.key});

  static const String routeName = '/overview';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final overviewAsync = ref.watch(adminOverviewProvider);

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(context, ref, isDark),
          Expanded(
            child: overviewAsync.when(
              loading: _buildSkeleton,
              error: (err, _) => _ErrorState(
                message:
                    err is ServerException ? err.message : err.toString(),
                onRetry: () => ref.invalidate(adminOverviewProvider),
              ),
              data: (data) => RefreshIndicator(
                onRefresh: () async => ref.invalidate(adminOverviewProvider),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.xl,
                    AppSpacing.sm,
                    AppSpacing.xl,
                    AppSpacing.xl,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _KpiGrid(data: data, isDark: isDark, ref: ref),
                      const SizedBox(height: AppSpacing.xl),
                      _TaskDistributionCard(data: data, isDark: isDark),
                      const SizedBox(height: AppSpacing.xl),
                      _UrgentDeadlinesSection(data: data, isDark: isDark),
                      const SizedBox(height: AppSpacing.xl),
                      _ProjectsSection(data: data, isDark: isDark),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref, bool isDark) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl, AppSpacing.xl, AppSpacing.md, AppSpacing.sm),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha:0.12),
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: const Icon(Icons.bar_chart_rounded,
                color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Dashboard',
                    style: Theme.of(context)
                        .textTheme
                        .headlineSmall
                        ?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: isDark
                              ? AppColors.textPrimaryDark
                              : AppColors.textPrimaryLight,
                        )),
                Text('Overview & analytics',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: isDark
                              ? AppColors.textSecondaryDark
                              : AppColors.textSecondaryLight,
                        )),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20),
            tooltip: 'Refresh',
            color: isDark
                ? AppColors.textSecondaryDark
                : AppColors.textSecondaryLight,
            onPressed: () => ref.invalidate(adminOverviewProvider),
          ),
        ],
      ),
    );
  }

  Widget _buildSkeleton() {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Expanded(child: ShimmerLoading(width: double.infinity, height: 90)),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: ShimmerLoading(width: double.infinity, height: 90)),
          ]),
          const SizedBox(height: AppSpacing.md),
          Row(children: [
            Expanded(child: ShimmerLoading(width: double.infinity, height: 90)),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: ShimmerLoading(width: double.infinity, height: 90)),
          ]),
          const SizedBox(height: AppSpacing.xl),
          ShimmerLoading(width: double.infinity, height: 180),
          const SizedBox(height: AppSpacing.xl),
          ShimmerLoading(width: double.infinity, height: 100),
          const SizedBox(height: AppSpacing.sm),
          ShimmerLoading(width: double.infinity, height: 100),
          const SizedBox(height: AppSpacing.sm),
          ShimmerLoading(width: double.infinity, height: 100),
        ],
      ),
    );
  }
}

// ─── Error state ──────────────────────────────────────────────────────────────

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline_rounded,
              color: AppColors.error, size: 48),
          const SizedBox(height: AppSpacing.md),
          Text(message,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: AppColors.error),
              textAlign: TextAlign.center),
          const SizedBox(height: AppSpacing.lg),
          TextButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

// ─── KPI Grid (2×2) ───────────────────────────────────────────────────────────

class _KpiGrid extends StatelessWidget {
  final AdminOverviewData data;
  final bool isDark;
  final WidgetRef ref;

  const _KpiGrid({required this.data, required this.isDark, required this.ref});

  @override
  Widget build(BuildContext context) {
    final cards = [
      (
        icon: Icons.folder_copy_rounded,
        color: AppColors.primary,
        value: data.totalProjects,
        label: 'Projects',
        onTap: () => context.go('/dashboard'),
      ),
      (
        icon: Icons.task_alt_rounded,
        color: AppColors.accent,
        value: data.totalTasks,
        label: 'Total Tasks',
        onTap: () => context.go('/dashboard'),
      ),
      (
        icon: Icons.people_rounded,
        color: AppColors.success,
        value: data.totalMembers,
        label: 'Members',
        onTap: () => context.go('/team'),
      ),
      (
        icon: Icons.hourglass_top_rounded,
        color: AppColors.warning,
        value: data.pendingCount,
        label: 'Pending',
        onTap: () {
          ref.read(adminUserFilterProvider.notifier).state = 'PENDING';
          context.go('/admin');
        },
      ),
    ];

    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _KpiCard(item: cards[0], isDark: isDark)),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: _KpiCard(item: cards[1], isDark: isDark)),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(child: _KpiCard(item: cards[2], isDark: isDark)),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: _KpiCard(item: cards[3], isDark: isDark)),
          ],
        ),
      ],
    );
  }
}

class _KpiCard extends StatelessWidget {
  final ({IconData icon, Color color, int value, String label, VoidCallback onTap}) item;
  final bool isDark;

  const _KpiCard({required this.item, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isDark ? AppColors.surfaceDark : AppColors.cardLight,
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      child: InkWell(
        onTap: item.onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight,
            ),
          ),
          child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: item.color.withValues(alpha:0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(item.icon, color: item.color, size: 18),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            '${item.value}',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: isDark
                      ? AppColors.textPrimaryDark
                      : AppColors.textPrimaryLight,
                ),
          ),
          const SizedBox(height: 2),
          Text(
            item.label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                ),
          ),
        ],
          ),
        ),
      ),
    );
  }
}

// ─── Global task distribution donut ──────────────────────────────────────────

class _TaskDistributionCard extends StatelessWidget {
  final AdminOverviewData data;
  final bool isDark;

  const _TaskDistributionCard({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final all =
        data.tasksByProject.values.expand((l) => l).toList();
    final counts = {
      for (final s in TaskStatus.values)
        s: all.where((t) => t.status == s).length,
    };
    final total = all.length;
    final done = counts[TaskStatus.done] ?? 0;
    final completionRate =
        total == 0 ? 0 : ((done / total) * 100).round();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Task Distribution',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? AppColors.textPrimaryDark
                                : AppColors.textPrimaryLight,
                          ),
                    ),
                    Text(
                      'Across all projects',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: isDark
                                ? AppColors.textSecondaryDark
                                : AppColors.textSecondaryLight,
                          ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha:0.12),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                ),
                child: Text(
                  '$completionRate% done',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.success,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          total == 0
              ? _emptyDonut(context)
              : Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    _DonutChart(
                      counts: counts,
                      total: total,
                      size: 130,
                      holeRadius: 46,
                      ringWidth: 20,
                      centerLabel: '$total',
                      centerSublabel: 'tasks',
                      isDark: isDark,
                    ),
                    const SizedBox(width: AppSpacing.xl),
                    Expanded(
                      child: Column(
                        children: TaskStatus.values.map((s) {
                          final count = counts[s] ?? 0;
                          final pct = total == 0
                              ? 0
                              : ((count / total) * 100).round();
                          return _LegendRow(
                            color: _statusColors[s]!,
                            label: _statusLabels[s]!,
                            count: count,
                            pct: pct,
                            isDark: isDark,
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
        ],
      ),
    );
  }

  Widget _emptyDonut(BuildContext context) {
    return Center(
      child: Text(
        'No tasks yet',
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isDark
                  ? AppColors.textTertiaryDark
                  : AppColors.textTertiaryLight,
            ),
      ),
    );
  }
}

// ─── Reusable donut chart ─────────────────────────────────────────────────────

class _DonutChart extends StatelessWidget {
  final Map<TaskStatus, int> counts;
  final int total;
  final double size;
  final double holeRadius;
  final double ringWidth;
  final String centerLabel;
  final String? centerSublabel;
  final bool isDark;

  const _DonutChart({
    required this.counts,
    required this.total,
    required this.size,
    required this.holeRadius,
    required this.ringWidth,
    required this.centerLabel,
    this.centerSublabel,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final sections = <PieChartSectionData>[];

    if (total == 0) {
      sections.add(PieChartSectionData(
        value: 1,
        color: isDark ? AppColors.borderDark : AppColors.borderLight,
        radius: ringWidth,
        showTitle: false,
      ));
    } else {
      for (final s in TaskStatus.values) {
        final count = counts[s] ?? 0;
        if (count == 0) continue;
        sections.add(PieChartSectionData(
          value: count.toDouble(),
          color: _statusColors[s]!,
          radius: ringWidth,
          showTitle: false,
        ));
      }
    }

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          PieChart(
            PieChartData(
              sections: sections,
              centerSpaceRadius: holeRadius,
              sectionsSpace: total == 0 ? 0 : 2,
              startDegreeOffset: -90,
            ),
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeOutCubic,
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                centerLabel,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight,
                      height: 1,
                    ),
              ),
              if (centerSublabel != null)
                Text(
                  centerSublabel!,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                      ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Legend row ───────────────────────────────────────────────────────────────

class _LegendRow extends StatelessWidget {
  final Color color;
  final String label;
  final int count;
  final int pct;
  final bool isDark;

  const _LegendRow({
    required this.color,
    required this.label,
    required this.count,
    required this.pct,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight,
                  ),
            ),
          ),
          Text(
            '$count',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(width: AppSpacing.xs),
          SizedBox(
            width: 34,
            child: Text(
              '$pct%',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: isDark
                        ? AppColors.textTertiaryDark
                        : AppColors.textTertiaryLight,
                  ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Urgent deadlines section ────────────────────────────────────────────────

class _UrgentDeadlinesSection extends StatelessWidget {
  final AdminOverviewData data;
  final bool isDark;

  const _UrgentDeadlinesSection({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final items = data.urgentTasks();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Upcoming Deadlines',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight,
                    ),
              ),
            ),
            if (items.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.12),
                  borderRadius:
                      BorderRadius.circular(AppSpacing.radiusFull),
                ),
                child: Text(
                  '${items.length}',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.error,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        if (items.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.cardLight,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border: Border.all(
                color: isDark ? AppColors.borderDark : AppColors.borderLight,
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.check_circle_outline_rounded,
                    color: AppColors.success, size: 20),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  'No urgent deadlines in the next 7 days',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                      ),
                ),
              ],
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            separatorBuilder: (context, i) =>
                const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, i) => _DeadlineCard(
              task: items[i].task,
              projectName: items[i].projectName,
              isDark: isDark,
              onTap: () => context.go('/board/${items[i].task.projectId}?taskId=${items[i].task.id}'),
            ),
          ),
      ],
    );
  }
}

class _DeadlineCard extends StatelessWidget {
  final TaskEntity task;
  final String projectName;
  final bool isDark;
  final VoidCallback? onTap;

  const _DeadlineCard({
    required this.task,
    required this.projectName,
    required this.isDark,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final due = task.dueDate!;
    final dueDay = DateTime(due.year, due.month, due.day);
    final diff = dueDay.difference(today).inDays;

    final (urgencyColor, urgencyLabel) = switch (diff) {
      < 0 => (AppColors.error, '${-diff}d overdue'),
      0 => (AppColors.error, 'Due today'),
      1 => (AppColors.warning, 'Due tomorrow'),
      _ => (AppColors.kanbanReview, 'In ${diff}d'),
    };

    final (priorityColor, priorityLabel) = switch (task.priority) {
      TaskPriority.urgent => (AppColors.error, 'Urgent'),
      TaskPriority.high => (AppColors.warning, 'High'),
      TaskPriority.medium => (AppColors.accent, 'Medium'),
      TaskPriority.low => (AppColors.kanbanTodo, 'Low'),
    };

    return Material(
      color: isDark ? AppColors.surfaceDark : AppColors.cardLight,
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
          color: diff < 0
              ? AppColors.error.withValues(alpha: 0.35)
              : isDark
                  ? AppColors.borderDark
                  : AppColors.borderLight,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Urgency indicator strip
          Container(
            width: 3,
            height: 48,
            decoration: BoxDecoration(
              color: urgencyColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Icon(Icons.folder_outlined,
                        size: 12,
                        color: isDark
                            ? AppColors.textTertiaryDark
                            : AppColors.textTertiaryLight),
                    const SizedBox(width: 3),
                    Text(
                      projectName,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: isDark
                                ? AppColors.textTertiaryDark
                                : AppColors.textTertiaryLight,
                          ),
                    ),
                    if (task.assigneeName != null) ...[
                      const SizedBox(width: AppSpacing.sm),
                      Icon(Icons.person_outline_rounded,
                          size: 12,
                          color: isDark
                              ? AppColors.textTertiaryDark
                              : AppColors.textTertiaryLight),
                      const SizedBox(width: 3),
                      Text(
                        task.assigneeName!,
                        style:
                            Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: isDark
                                      ? AppColors.textTertiaryDark
                                      : AppColors.textTertiaryLight,
                                ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Due date chip
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: urgencyColor.withValues(alpha: 0.12),
                  borderRadius:
                      BorderRadius.circular(AppSpacing.radiusFull),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.schedule_rounded,
                        size: 11, color: urgencyColor),
                    const SizedBox(width: 3),
                    Text(
                      urgencyLabel,
                      style: Theme.of(context)
                          .textTheme
                          .labelSmall
                          ?.copyWith(
                            color: urgencyColor,
                            fontWeight: FontWeight.w700,
                            fontSize: 10,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              // Priority badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: priorityColor.withValues(alpha: 0.10),
                  borderRadius:
                      BorderRadius.circular(AppSpacing.radiusSm),
                ),
                child: Text(
                  priorityLabel,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: priorityColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 10,
                      ),
                ),
              ),
            ],
          ),
        ],
      ),
        ),
      ),
    );
  }
}

// ─── Projects section ─────────────────────────────────────────────────────────

class _ProjectsSection extends StatelessWidget {
  final AdminOverviewData data;
  final bool isDark;

  const _ProjectsSection({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Projects',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight,
              ),
        ),
        const SizedBox(height: AppSpacing.md),
        if (data.projects.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.xxl),
              child: Text(
                'No projects yet',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: isDark
                          ? AppColors.textTertiaryDark
                          : AppColors.textTertiaryLight,
                    ),
              ),
            ),
          )
        else
          LayoutBuilder(
            builder: (context, constraints) {
              final cols =
                  (constraints.maxWidth / 160).floor().clamp(2, 4);
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: cols,
                  crossAxisSpacing: AppSpacing.md,
                  mainAxisSpacing: AppSpacing.md,
                  mainAxisExtent: 148,
                ),
                itemCount: data.projects.length,
                itemBuilder: (context, i) {
                  final project = data.projects[i];
                  final tasks = data.tasksByProject[project.id] ?? [];
                  return _ProjectCard(
                    project: project,
                    tasks: tasks,
                    isDark: isDark,
                    onTap: () => context.go('/board/${project.id}'),
                  );
                },
              );
            },
          ),
      ],
    );
  }
}

// ─── Project card with mini donut (grid layout) ──────────────────────────────

class _ProjectCard extends StatelessWidget {
  final ProjectEntity project;
  final List<TaskEntity> tasks;
  final bool isDark;
  final VoidCallback? onTap;

  const _ProjectCard({
    required this.project,
    required this.tasks,
    required this.isDark,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final counts = {
      for (final s in TaskStatus.values)
        s: tasks.where((t) => t.status == s).length,
    };
    final total = tasks.length;
    final done = counts[TaskStatus.done] ?? 0;
    final pct = total == 0 ? 0 : ((done / total) * 100).round();

    Color? projectColor;
    if (project.color != null) {
      try {
        projectColor =
            Color(int.parse(project.color!.replaceFirst('#', '0xFF')));
      } catch (_) {}
    }

    return Material(
      color: isDark ? AppColors.surfaceDark : AppColors.cardLight,
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header ──
          Row(
            children: [
              if (projectColor != null) ...[
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                      color: projectColor, shape: BoxShape.circle),
                ),
                const SizedBox(width: AppSpacing.xs),
              ],
              Expanded(
                child: Text(
                  project.name,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                      ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),

          // ── Donut + légende côte à côte ──
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _DonutChart(
                counts: counts,
                total: total,
                size: 72,
                holeRadius: 24,
                ringWidth: 11,
                centerLabel: '$pct%',
                isDark: isDark,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: TaskStatus.values.map((s) {
                    final count = counts[s] ?? 0;
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: _statusColors[s]!,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              _statusLabels[s]!,
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(
                                    fontSize: 10,
                                    color: isDark
                                        ? AppColors.textSecondaryDark
                                        : AppColors.textSecondaryLight,
                                  ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            '$count',
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: _statusColors[s]!,
                                ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ],
      ),
        ),
      ),
    );
  }
}
