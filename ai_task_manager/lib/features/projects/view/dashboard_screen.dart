import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ai_task_manager/core/design_system/app_button.dart';
import 'package:ai_task_manager/core/design_system/empty_state.dart';
import 'package:ai_task_manager/core/design_system/loading_skeleton.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/projects/model/project_entity.dart';
import 'package:ai_task_manager/features/projects/viewmodel/project_viewmodel.dart';
import 'package:ai_task_manager/features/projects/view/project_card.dart';
import 'package:ai_task_manager/features/projects/view/create_project_dialog.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsAsync = ref.watch(projectListProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? AppColors.backgroundDark
          : AppColors.backgroundLight,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _DashboardHeader(isDark: isDark, ref: ref),
          Expanded(
            child: projectsAsync.when(
              data: (projects) => projects.isEmpty
                  ? EmptyState(
                      icon: Icons.folder_open_rounded,
                      title: 'No projects yet',
                      description:
                          'Create your first project to start managing tasks with AI-powered planning.',
                      actionLabel: 'Create Project',
                      onAction: () => _showCreateProject(context, ref),
                    )
                  : _ProjectGrid(projects: projects, ref: ref),
              loading: () => const _DashboardSkeleton(),
              error: (error, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.error_outline_rounded,
                      size: 48,
                      color: isDark
                          ? AppColors.textTertiaryDark
                          : AppColors.textTertiaryLight,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      'Failed to load projects',
                      style: TextStyle(
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    AppButton(
                      label: 'Retry',
                      onPressed: () => ref.invalidate(projectListProvider),
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

  void _showCreateProject(BuildContext context, WidgetRef ref) async {
    final result = await CreateProjectDialog.show(context);
    if (result != null) {
      ref
          .read(projectListProvider.notifier)
          .createProject(
            name: result.name,
            description: result.description,
            color: result.color,
          );
    }
  }
}

class _DashboardHeader extends StatelessWidget {
  const _DashboardHeader({required this.isDark, required this.ref});

  final bool isDark;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xxxl,
            vertical: AppSpacing.xxl,
          ),
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            border: Border(
              bottom: BorderSide(
                color: isDark ? AppColors.borderDark : AppColors.borderLight,
                width: 1,
              ),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Projects',
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            color: isDark
                                ? AppColors.textPrimaryDark
                                : AppColors.textPrimaryLight,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Manage your projects and AI-powered task planning',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
              ),
              AppButton(
                label: 'New Project',
                icon: Icons.add_rounded,
                onPressed: () async {
                  final result = await CreateProjectDialog.show(context);
                  if (result != null) {
                    ref
                        .read(projectListProvider.notifier)
                        .createProject(
                          name: result.name,
                          description: result.description,
                          color: result.color,
                        );
                  }
                },
                variant: AppButtonVariant.primary,
                size: AppButtonSize.md,
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 300.ms)
        .slideY(begin: -0.05, end: 0, duration: 300.ms);
  }
}

class _ProjectGrid extends StatelessWidget {
  const _ProjectGrid({required this.projects, required this.ref});

  final List<ProjectEntity> projects;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 1200
            ? 4
            : constraints.maxWidth > 900
            ? 3
            : constraints.maxWidth > 600
            ? 2
            : 1;

        return GridView.builder(
          padding: const EdgeInsets.all(AppSpacing.xxxl),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: AppSpacing.xl,
            mainAxisSpacing: AppSpacing.xl,
            childAspectRatio: 1.6,
          ),
          itemCount: projects.length,
          itemBuilder: (context, index) {
            final project = projects[index];
            return ProjectCard(
                  project: project,
                  onTap: () {
                    ref.read(selectedProjectProvider.notifier).state = project;
                    debugPrint(
                      'Selected project: ${project.name} (ID: ${project.id})',
                    );
                  },
                  onDelete: () {
                    ref
                        .read(projectListProvider.notifier)
                        .deleteProject(project.id);
                  },
                )
                .animate()
                .fadeIn(
                  delay: Duration(milliseconds: 50 * index),
                  duration: 400.ms,
                )
                .slideY(
                  begin: 0.05,
                  end: 0,
                  delay: Duration(milliseconds: 50 * index),
                  duration: 400.ms,
                  curve: Curves.easeOut,
                );
          },
        );
      },
    );
  }
}

class _DashboardSkeleton extends StatelessWidget {
  const _DashboardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xxxl),
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: AppSpacing.xl,
          mainAxisSpacing: AppSpacing.xl,
          childAspectRatio: 1.6,
        ),
        itemCount: 6,
        itemBuilder: (context, index) {
          return const ShimmerLoading(
            width: double.infinity,
            height: double.infinity,
            borderRadius: AppSpacing.radiusLg,
          );
        },
      ),
    );
  }
}
