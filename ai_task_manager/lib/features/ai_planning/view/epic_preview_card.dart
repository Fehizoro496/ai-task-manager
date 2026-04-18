import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/core/utils/constants.dart';
import 'package:ai_task_manager/features/ai_planning/model/ai_draft_entity.dart';
import 'package:ai_task_manager/features/ai_planning/view/story_preview_card.dart';

class EpicPreviewCard extends StatefulWidget {
  const EpicPreviewCard({
    super.key,
    required this.epic,
    this.index = 0,
  });

  final AiEpicDraft epic;
  final int index;

  @override
  State<EpicPreviewCard> createState() => _EpicPreviewCardState();
}

class _EpicPreviewCardState extends State<EpicPreviewCard> {
  bool _isExpanded = true;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.cardDark : AppColors.cardLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final textPrimary =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return ClipRRect(
      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.07) : Colors.white.withOpacity(0.74),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.10) : Colors.white.withOpacity(0.85),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.25 : 0.06),
            blurRadius: 18,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () => setState(() => _isExpanded = !_isExpanded),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                children: [
                  Container(
                    width: 4,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.epic.title,
                          style: TextStyle(
                            color: textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (widget.epic.description != null) ...[
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            widget.epic.description!,
                            style: TextStyle(
                              color: textSecondary,
                              fontSize: 12,
                              height: 1.4,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: AppSpacing.xxs,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primarySurface,
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusFull),
                    ),
                    child: Text(
                      '${widget.epic.stories.length} stories',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  AnimatedRotation(
                    turns: _isExpanded ? 0.5 : 0,
                    duration: AppConstants.animationDuration,
                    child: Icon(
                      Icons.keyboard_arrow_down_rounded,
                      size: 20,
                      color: textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.only(
                left: AppSpacing.xxl,
                right: AppSpacing.lg,
                bottom: AppSpacing.lg,
              ),
              child: Column(
                children: widget.epic.stories
                    .asMap()
                    .entries
                    .map(
                      (entry) => Padding(
                        padding:
                            const EdgeInsets.only(top: AppSpacing.sm),
                        child: StoryPreviewCard(
                          story: entry.value,
                          index: entry.key,
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
            crossFadeState: _isExpanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: AppConstants.animationDuration,
          ),
        ],
      ),
        ),
      ),
    );
  }
}
