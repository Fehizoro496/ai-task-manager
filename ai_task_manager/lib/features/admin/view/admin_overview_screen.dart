import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/core/design_system/loading_skeleton.dart';
import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/admin/viewmodel/admin_viewmodel.dart';
import 'package:ai_task_manager/features/tasks/model/task_entity.dart';
import 'package:ai_task_manager/features/projects/model/project_entity.dart';

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
          _buildHeader(context, isDark),
          Expanded(
            child: overviewAsync.when(
              loading: () => _buildSkeleton(),
              error: (err, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.error_outline_rounded,
                        color: AppColors.error, size: 48),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      err is ServerException ? err.message : err.toString(),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.error,
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    TextButton.icon(
                      onPressed: () =>
                          ref.invalidate(adminOverviewProvider),
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
              data: (data) => SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.xl),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _StatsRow(data: data, isDark: isDark),
                    const SizedBox(height: AppSpacing.xxl),
                    _ProjectBreakdown(
                      data: data,
                      isDark: isDark,
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
                  Icons.bar_chart_rounded,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Text(
                'Dashboard',
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
            'Overview of projects and task progress',
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

  Widget _buildSkeleton() {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                  child: ShimmerLoading(
                      width: double.infinity, height: 80)),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                  child: ShimmerLoading(
                      width: double.infinity, height: 80)),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                  child: ShimmerLoading(
                      width: double.infinity, height: 80)),
            ],
          ),
          const SizedBox(height: AppSpacing.xxl),
          ShimmerLoading(width: double.infinity, height: 60),
          const SizedBox(height: AppSpacing.sm),
          ShimmerLoading(width: double.infinity, height: 60),
          const SizedBox(height: AppSpacing.sm),
          ShimmerLoading(width: double.infinity, height: 60),
          const SizedBox(height: AppSpacing.sm),
          ShimmerLoading(width: double.infinity, height: 60),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final AdminOverviewData data;
  final bool isDark;

  const _StatsRow({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.folder_rounded,
            color: AppColors.primary,
            value: data.totalProjects,
            label: 'Total Projects',
            isDark: isDark,
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: _StatCard(
            icon: Icons.task_alt_rounded,
            color: AppColors.accent,
            value: data.totalTasks,
            label: 'Total Tasks',
            isDark: isDark,
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: _StatCard(
            icon: Icons.people_rounded,
            color: AppColors.success,
            value: data.totalMembers,
            label: 'Team Members',
            isDark: isDark,
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final int value;
  final String label;
  final bool isDark;

  const _StatCard({
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
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
          Icon(icon, color: color, size: 24),
          const SizedBox(height: AppSpacing.sm),
          Text(
            value.toString(),
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: isDark
                      ? AppColors.textPrimaryDark
                      : AppColors.textPrimaryLight,
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
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

class _ProjectBreakdown extends StatelessWidget {
  final AdminOverviewData data;
  final bool isDark;

  const _ProjectBreakdown({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Projects Breakdown',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight,
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: AppSpacing.md),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: data.projects.length,
          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, index) {
            final project = data.projects[index];
            final tasks = data.tasksByProject[project.id] ?? [];
            return _ProjectRow(
              project: project,
              tasks: tasks,
              isDark: isDark,
            );
          },
        ),
      ],
    );
  }
}

class _ProjectRow extends StatelessWidget {
  final ProjectEntity project;
  final List<TaskEntity> tasks;
  final bool isDark;

  const _ProjectRow({
    required this.project,
    required this.tasks,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final todo = tasks.where((t) => t.status == TaskStatus.todo).length;
    final inProgress =
        tasks.where((t) => t.status == TaskStatus.inProgress).length;
    final inReview =
        tasks.where((t) => t.status == TaskStatus.inReview).length;
    final done = tasks.where((t) => t.status == TaskStatus.done).length;
    final total = tasks.length;
    final progressValue = total == 0 ? 0.0 : done / total;

    Color? projectColor;
    if (project.color != null) {
      try {
        projectColor = Color(
            int.parse(project.color!.replaceFirst('#', '0xFF')));
      } catch (_) {}
    }

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
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
              if (projectColor != null) ...[
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: projectColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
              ],
              Expanded(
                child: Text(
                  project.name,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              _CountBadge(
                  count: todo,
                  color: AppColors.kanbanTodo,
                  label: 'Todo'),
              const SizedBox(width: AppSpacing.xs),
              _CountBadge(
                  count: inProgress,
                  color: AppColors.kanbanInProgress,
                  label: 'In Progress'),
              const SizedBox(width: AppSpacing.xs),
              _CountBadge(
                  count: inReview,
                  color: AppColors.kanbanReview,
                  label: 'In Review'),
              const SizedBox(width: AppSpacing.xs),
              _CountBadge(
                  count: done,
                  color: AppColors.kanbanDone,
                  label: 'Done'),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          if (total == 0)
            Text(
              'No tasks',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: isDark
                        ? AppColors.textTertiaryDark
                        : AppColors.textTertiaryLight,
                  ),
            )
          else
            LinearProgressIndicator(
              value: progressValue,
              backgroundColor:
                  (isDark ? AppColors.borderDark : AppColors.borderLight),
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppColors.success),
              borderRadius:
                  BorderRadius.circular(AppSpacing.radiusFull),
            ),
        ],
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  final int count;
  final Color color;
  final String label;

  const _CountBadge({
    required this.count,
    required this.color,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label,
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm, vertical: 2),
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Text(
          count.toString(),
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: color,
                fontWeight: FontWeight.w600,
              ),
        ),
      ),
    );
  }
}
