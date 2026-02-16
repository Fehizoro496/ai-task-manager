import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ai_task_manager/core/design_system/app_button.dart';
import 'package:ai_task_manager/core/design_system/loading_skeleton.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/ai_planning/model/ai_draft_entity.dart';
import 'package:ai_task_manager/features/ai_planning/viewmodel/ai_planning_viewmodel.dart';
import 'package:ai_task_manager/features/ai_planning/view/epic_preview_card.dart';

class AiPlanningScreen extends ConsumerStatefulWidget {
  const AiPlanningScreen({super.key});

  @override
  ConsumerState<AiPlanningScreen> createState() => _AiPlanningScreenState();
}

class _AiPlanningScreenState extends ConsumerState<AiPlanningScreen> {
  final _documentController = TextEditingController();
  bool _showPlanPanel = false;

  @override
  void dispose() {
    _documentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final asyncState = ref.watch(aiPlanningStateProvider);
    final planningState = asyncState.valueOrNull ?? const AiPlanningState();
    final draft = planningState.currentDraft;

    final isGenerating = planningState.isGenerating;
    final hasGeneratedPlan =
        draft != null && draft.generatedPlan != null;

    if (hasGeneratedPlan && !_showPlanPanel) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        setState(() => _showPlanPanel = true);
      });
    }

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: Column(
        children: [
          _buildHeader(isDark),
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left panel - Input
                Expanded(
                  flex: _showPlanPanel ? 1 : 2,
                  child: _buildInputPanel(isDark, isGenerating),
                ),
                // Right panel - Generated plan
                if (_showPlanPanel && hasGeneratedPlan)
                  Expanded(
                    flex: 1,
                    child: _buildPlanPanel(isDark, draft)
                        .animate()
                        .fadeIn(duration: 400.ms)
                        .slideX(
                          begin: 0.1,
                          end: 0,
                          duration: 400.ms,
                          curve: Curves.easeOut,
                        ),
                  ),
                if (isGenerating && !hasGeneratedPlan)
                  Expanded(
                    flex: 1,
                    child: _buildLoadingPanel(isDark),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isDark) {
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
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.primary, AppColors.accent],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: Colors.white,
              size: 22,
            ),
          ),
          const SizedBox(width: AppSpacing.lg),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI Planning',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  'Paste your project document and let AI generate a structured backlog',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }

  Widget _buildInputPanel(bool isDark, bool isGenerating) {
    final textPrimary =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textTertiary =
        isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final fillColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.xxxl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Project Document',
            style: TextStyle(
              color: textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Paste your requirements, PRD, feature spec, or any project description.',
            style: TextStyle(
              color: textTertiary,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Container(
            decoration: BoxDecoration(
              color: fillColor,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border: Border.all(color: borderColor),
            ),
            child: TextField(
              controller: _documentController,
              maxLines: 16,
              enabled: !isGenerating,
              style: TextStyle(
                color: textPrimary,
                fontSize: 13,
                fontFamily: 'monospace',
                height: 1.6,
              ),
              decoration: InputDecoration(
                hintText:
                    'e.g. We are building a mobile banking app with the following features:\n\n1. User registration and KYC verification\n2. Account dashboard with balance overview\n3. Fund transfers (internal and external)\n4. Bill payments\n5. Transaction history with search and filters\n...',
                hintStyle: TextStyle(
                  color: textTertiary,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  height: 1.6,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(AppSpacing.lg),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Text(
                '${_documentController.text.length} characters',
                style: TextStyle(
                  color: textTertiary,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              AppButton(
                label: isGenerating ? 'Generating...' : 'Generate Plan',
                icon: Icons.auto_awesome_rounded,
                isLoading: isGenerating,
                onPressed: isGenerating ||
                        _documentController.text.trim().isEmpty
                    ? null
                    : () {
                        ref
                            .read(aiPlanningStateProvider.notifier)
                            .generatePlan(
                              'default-project',
                              _documentController.text.trim(),
                            );
                      },
                variant: AppButtonVariant.primary,
                size: AppButtonSize.lg,
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms, duration: 300.ms);
  }

  Widget _buildPlanPanel(bool isDark, AiDraftEntity draft) {
    final plan = draft.generatedPlan!;
    final textPrimary =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final surfaceColor =
        isDark ? AppColors.surfaceDark : AppColors.surfaceLight;

    return Container(
      decoration: BoxDecoration(
        border: Border(
          left: BorderSide(color: borderColor, width: 1),
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              color: surfaceColor,
              border: Border(
                bottom: BorderSide(color: borderColor, width: 1),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.check_circle_rounded,
                      color: AppColors.success,
                      size: 20,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      'Generated Plan',
                      style: TextStyle(
                        color: textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Wrap(
                  spacing: AppSpacing.md,
                  children: [
                    _StatBadge(
                      label: '${plan.epics.length} Epics',
                      color: AppColors.primary,
                    ),
                    _StatBadge(
                      label: '${plan.totalStories} Stories',
                      color: AppColors.info,
                    ),
                    _StatBadge(
                      label: '${plan.totalTasks} Tasks',
                      color: AppColors.success,
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.xl),
              itemCount: plan.epics.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: AppSpacing.md),
              itemBuilder: (context, index) {
                return EpicPreviewCard(
                  epic: plan.epics[index],
                  index: index,
                )
                    .animate()
                    .fadeIn(
                      delay: Duration(milliseconds: 80 * index),
                      duration: 350.ms,
                    )
                    .slideY(
                      begin: 0.05,
                      end: 0,
                      delay: Duration(milliseconds: 80 * index),
                      duration: 350.ms,
                      curve: Curves.easeOut,
                    );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              color: surfaceColor,
              border: Border(
                top: BorderSide(color: borderColor, width: 1),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'Reject',
                    icon: Icons.close_rounded,
                    onPressed: () {
                      ref
                          .read(aiPlanningStateProvider.notifier)
                          .rejectDraft();
                      setState(() => _showPlanPanel = false);
                    },
                    variant: AppButtonVariant.danger,
                    size: AppButtonSize.md,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      ref
                          .read(aiPlanningStateProvider.notifier)
                          .approveDraft();
                    },
                    icon: const Icon(Icons.check_rounded, size: 18),
                    label: const Text('Approve & Create All'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.success,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.md,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius:
                            BorderRadius.circular(AppSpacing.radiusMd),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingPanel(bool isDark) {
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    return Container(
      decoration: BoxDecoration(
        border: Border(
          left: BorderSide(color: borderColor, width: 1),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          children: [
            const SizedBox(height: AppSpacing.xxxxl),
            const CircularProgressIndicator(
              color: AppColors.primary,
              strokeWidth: 2.5,
            ),
            const SizedBox(height: AppSpacing.xxl),
            Text(
              'Generating your plan...',
              style: TextStyle(
                color: isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'AI is analyzing your document and structuring tasks',
              style: TextStyle(
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: AppSpacing.xxxl),
            ...List.generate(
              3,
              (index) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: ShimmerLoading(
                  width: double.infinity,
                  height: 80,
                  borderRadius: AppSpacing.radiusLg,
                ),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms);
  }
}

class _StatBadge extends StatelessWidget {
  const _StatBadge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xxs,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
