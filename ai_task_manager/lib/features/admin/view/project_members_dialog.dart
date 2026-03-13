import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/admin/model/admin_user_model.dart';
import 'package:ai_task_manager/features/admin/model/project_member_model.dart';
import 'package:ai_task_manager/features/admin/viewmodel/admin_viewmodel.dart';

class ProjectMembersDialog extends ConsumerStatefulWidget {
  final String projectId;
  final String projectName;

  const ProjectMembersDialog({
    super.key,
    required this.projectId,
    required this.projectName,
  });

  static Future<void> show(
    BuildContext context, {
    required String projectId,
    required String projectName,
  }) {
    return showDialog(
      context: context,
      builder: (_) => ProjectMembersDialog(
        projectId: projectId,
        projectName: projectName,
      ),
    );
  }

  @override
  ConsumerState<ProjectMembersDialog> createState() =>
      _ProjectMembersDialogState();
}

class _ProjectMembersDialogState extends ConsumerState<ProjectMembersDialog> {
  String? _selectedUserId;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final membersAsync =
        ref.watch(projectMembersProvider(widget.projectId));
    final approvedUsers = ref.watch(approvedUsersProvider);

    return Dialog(
      backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        side: BorderSide(
            color: isDark ? AppColors.borderDark : AppColors.borderLight),
      ),
      child: SizedBox(
        width: 480,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(context, isDark),
            const Divider(height: 1),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildAddSection(context, isDark, membersAsync, approvedUsers),
                    const SizedBox(height: AppSpacing.lg),
                    _buildMembersList(context, isDark, membersAsync),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: const Icon(Icons.group_rounded,
                color: AppColors.primary, size: 18),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Membres du projet',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                      ),
                ),
                Text(
                  widget.projectName,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                      ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.close_rounded, size: 18),
            style: IconButton.styleFrom(
              foregroundColor: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddSection(
    BuildContext context,
    bool isDark,
    AsyncValue<List<ProjectMemberModel>> membersAsync,
    AsyncValue<List<AdminUserModel>> approvedUsers,
  ) {
    final currentMemberIds =
        membersAsync.valueOrNull?.map((m) => m.userId).toSet() ?? {};

    final availableUsers = approvedUsers.valueOrNull
            ?.where((u) => !u.isAdmin && !currentMemberIds.contains(u.id))
            .toList() ??
        [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Ajouter un participant',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color:
                    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                decoration: BoxDecoration(
                  border: Border.all(
                    color:
                        isDark ? AppColors.borderDark : AppColors.borderLight,
                  ),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  color: isDark ? AppColors.cardDark : AppColors.cardLight,
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedUserId,
                    hint: Text(
                      availableUsers.isEmpty
                          ? 'Aucun utilisateur disponible'
                          : 'Sélectionner un utilisateur',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: isDark
                                ? AppColors.textSecondaryDark
                                : AppColors.textSecondaryLight,
                          ),
                    ),
                    dropdownColor:
                        isDark ? AppColors.cardDark : AppColors.surfaceLight,
                    isExpanded: true,
                    items: availableUsers
                        .map((u) => DropdownMenuItem(
                              value: u.id,
                              child: Text(
                                '${u.name} (${u.email})',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: isDark
                                          ? AppColors.textPrimaryDark
                                          : AppColors.textPrimaryLight,
                                    ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ))
                        .toList(),
                    onChanged: availableUsers.isEmpty
                        ? null
                        : (v) => setState(() => _selectedUserId = v),
                  ),
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            FilledButton(
              onPressed: _selectedUserId == null
                  ? null
                  : () async {
                      final userId = _selectedUserId!;
                      setState(() => _selectedUserId = null);
                      try {
                        await ref
                            .read(projectMembersProvider(widget.projectId)
                                .notifier)
                            .addMember(userId);
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(e.toString()),
                              backgroundColor: AppColors.error,
                            ),
                          );
                        }
                      }
                    },
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md, vertical: AppSpacing.md),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
              ),
              child: const Icon(Icons.add_rounded, size: 18),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMembersList(
    BuildContext context,
    bool isDark,
    AsyncValue<List<ProjectMemberModel>> membersAsync,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Participants actuels',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color:
                    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              ),
        ),
        const SizedBox(height: AppSpacing.sm),
        membersAsync.when(
          data: (members) => members.isEmpty
              ? Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                  child: Text(
                    'Aucun participant pour l\'instant.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: isDark
                              ? AppColors.textSecondaryDark
                              : AppColors.textSecondaryLight,
                        ),
                  ),
                )
              : Column(
                  children: members
                      .map((m) => _MemberTile(
                            member: m,
                            isDark: isDark,
                            onRemove: () async {
                              try {
                                await ref
                                    .read(projectMembersProvider(widget.projectId)
                                        .notifier)
                                    .removeMember(m.userId);
                              } catch (e) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(e.toString()),
                                      backgroundColor: AppColors.error,
                                    ),
                                  );
                                }
                              }
                            },
                          ))
                      .toList(),
                ),
          loading: () =>
              const Center(child: CircularProgressIndicator()),
          error: (e, _) => Text(
            e.toString(),
            style: const TextStyle(color: AppColors.error),
          ),
        ),
      ],
    );
  }
}

class _MemberTile extends StatelessWidget {
  final ProjectMemberModel member;
  final bool isDark;
  final VoidCallback onRemove;

  const _MemberTile({
    required this.member,
    required this.isDark,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final u = member.user;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : AppColors.hoverLight,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primary.withValues(alpha: 0.15),
              backgroundImage:
                  u.avatarUrl != null ? NetworkImage(u.avatarUrl!) : null,
              child: u.avatarUrl == null
                  ? Text(
                      u.name.isNotEmpty ? u.name[0].toUpperCase() : '?',
                      style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700),
                    )
                  : null,
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    u.name,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppColors.textPrimaryDark
                              : AppColors.textPrimaryLight,
                        ),
                  ),
                  Text(
                    u.email,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: isDark
                              ? AppColors.textSecondaryDark
                              : AppColors.textSecondaryLight,
                        ),
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: onRemove,
              icon: const Icon(Icons.person_remove_rounded, size: 16),
              style: IconButton.styleFrom(foregroundColor: AppColors.error),
              tooltip: 'Retirer',
            ),
          ],
        ),
      ),
    );
  }
}
