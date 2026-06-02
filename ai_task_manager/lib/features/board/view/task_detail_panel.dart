import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:ai_task_manager/core/design_system/app_button.dart';
import 'package:ai_task_manager/core/design_system/app_toast.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/admin/model/project_member_model.dart';
import 'package:ai_task_manager/features/admin/viewmodel/admin_viewmodel.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';
import 'package:ai_task_manager/features/board/viewmodel/board_viewmodel.dart';
import 'package:ai_task_manager/features/projects/viewmodel/project_viewmodel.dart';
import 'package:ai_task_manager/features/tasks/model/task_entity.dart';
import 'package:ai_task_manager/features/tasks/viewmodel/task_viewmodel.dart';
import 'package:ai_task_manager/shared/user_avatar.dart';

/// Shows the task detail popup dialog.
void showTaskDetailDialog(
  BuildContext context, {
  required TaskEntity task,
  required String projectId,
}) {
  showDialog(
    context: context,
    barrierDismissible: false,
    barrierColor: Colors.black54,
    builder: (_) => TaskDetailDialog(task: task, projectId: projectId),
  );
}

String _formatDate(DateTime date) {
  final months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return '${months[date.month - 1]} ${date.day}, ${date.year}';
}

InputDecoration _inputDecoration({
  required String hint,
  required bool isDark,
  required Color hintColor,
  required Color borderColor,
}) {
  return InputDecoration(
    hintText: hint,
    hintStyle: TextStyle(color: hintColor, fontSize: 13),
    isDense: true,
    contentPadding: const EdgeInsets.symmetric(
      horizontal: AppSpacing.md,
      vertical: AppSpacing.md,
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
      borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
    ),
  );
}

class TaskDetailDialog extends ConsumerStatefulWidget {
  const TaskDetailDialog({
    super.key,
    required this.task,
    required this.projectId,
  });

  final TaskEntity task;
  final String projectId;

  @override
  ConsumerState<TaskDetailDialog> createState() => _TaskDetailDialogState();
}

class _TaskDetailDialogState extends ConsumerState<TaskDetailDialog> {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _labelInputController;
  late TaskStatus _status;
  late TaskPriority _priority;
  late DateTime? _dueDate;
  late List<String> _labels;
  late String? _assigneeId;
  late String? _assigneeName;
  bool _isDirty = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.task.title);
    _descriptionController = TextEditingController(
      text: widget.task.description ?? '',
    );
    _labelInputController = TextEditingController();
    _status = widget.task.status;
    _priority = widget.task.priority;
    _dueDate = widget.task.dueDate;
    _labels = List.from(widget.task.labels);
    _assigneeId = widget.task.assigneeId;
    _assigneeName = widget.task.assigneeName;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _labelInputController.dispose();
    super.dispose();
  }

  void _close() {
    ref.read(selectedTaskProvider.notifier).state = null;
    Navigator.of(context).pop();
  }

  Future<void> _saveChanges(bool isAdmin) async {
    setState(() => _isSaving = true);

    try {
      if (_status != widget.task.status) {
        await ref
            .read(boardTasksProvider(widget.projectId).notifier)
            .moveTask(
              taskId: widget.task.id,
              newStatus: _status,
              newOrder: widget.task.order,
            );
      }

      if (isAdmin) {
        final title = _titleController.text.trim();
        if (title.isEmpty) {
          setState(() => _isSaving = false);
          return;
        }
        final updated = TaskEntity(
          id: widget.task.id,
          identifier: widget.task.identifier,
          githubBranch: widget.task.githubBranch,
          title: title,
          description: _descriptionController.text.trim(),
          status: _status,
          priority: _priority,
          storyId: widget.task.storyId,
          projectId: widget.task.projectId,
          assigneeId: _assigneeId,
          assigneeName: _assigneeName,
          assigneeAvatar: _assigneeId == widget.task.assigneeId
              ? widget.task.assigneeAvatar
              : null,
          labels: _labels,
          order: widget.task.order,
          dueDate: _dueDate,
          createdAt: widget.task.createdAt,
          updatedAt: DateTime.now(),
        );
        await ref
            .read(boardTasksProvider(widget.projectId).notifier)
            .updateTask(updated);
        ref.read(selectedTaskProvider.notifier).state = updated;
      } else {
        // Non-admin: update local state with new status only
        final updated = widget.task.copyWith(status: _status);
        ref.read(selectedTaskProvider.notifier).state = updated;
      }

      setState(() {
        _isDirty = false;
        _isSaving = false;
      });
      if (!mounted) return;
      AppToast.success(context, 'Tâche mise à jour');
    } catch (_) {
      setState(() => _isSaving = false);
      if (!mounted) return;
      AppToast.error(context, 'Échec de la mise à jour');
    }
  }

  Future<void> _deleteTask() async {
    ref.read(selectedTaskProvider.notifier).state = null;
    Navigator.of(context).pop();
    await ref
        .read(boardTasksProvider(widget.projectId).notifier)
        .deleteTask(widget.task.id);
  }

  void _addLabel(String value) {
    final label = value.trim();
    if (label.isEmpty || _labels.contains(label)) return;
    setState(() {
      _labels.add(label);
      _isDirty = true;
    });
    _labelInputController.clear();
  }

  void _removeLabel(String label) {
    setState(() {
      _labels.remove(label);
      _isDirty = true;
    });
  }

  void _onAssigneeChanged(ProjectMemberModel? member) {
    setState(() {
      _assigneeId = member?.userId;
      _assigneeName = member?.user.name;
      _isDirty = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor =
        isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final titleColor =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final labelColor =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final hintColor =
        isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight;

    final currentUser = ref.watch(authStateProvider).valueOrNull;
    final isAdmin = currentUser?.isAdmin ?? false;

    return Center(
      child: Material(
        color: Colors.transparent,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
            child: Container(
          width: 480,
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.85,
          ),
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF1D1D1F).withOpacity(0.88)
                : Colors.white.withOpacity(0.88),
            borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
            border: Border.all(
              color: isDark
                  ? Colors.white.withOpacity(0.10)
                  : Colors.black.withOpacity(0.06),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.55 : 0.18),
                blurRadius: 48,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.xl,
                  vertical: AppSpacing.lg,
                ),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: borderColor)),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(AppSpacing.radiusXl),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Task Details',
                            style: TextStyle(
                              color: titleColor,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (widget.task.identifier != null) ...[
                            const SizedBox(height: 4),
                            _IdentifierBadge(
                              identifier: widget.task.identifier!,
                              isDark: isDark,
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (isAdmin)
                      _HeaderIconButton(
                        onTap: _deleteTask,
                        icon: Icons.delete_outline_rounded,
                        color: AppColors.error.withOpacity(0.7),
                        hoverColor: AppColors.error.withOpacity(0.1),
                      ),
                    _HeaderIconButton(
                      onTap: _close,
                      icon: Icons.close_rounded,
                      color: labelColor,
                    ),
                  ],
                ),
              ),

              // Body
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SectionLabel(label: 'Title', color: labelColor),
                      const SizedBox(height: AppSpacing.xs),
                      TextField(
                        controller: _titleController,
                        readOnly: !isAdmin,
                        style: TextStyle(
                          color: titleColor,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                        decoration: _inputDecoration(
                          hint: 'Task title',
                          isDark: isDark,
                          hintColor: hintColor,
                          borderColor: borderColor,
                        ),
                        onChanged: isAdmin
                            ? (_) => setState(() => _isDirty = true)
                            : null,
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      _SectionLabel(label: 'Description', color: labelColor),
                      const SizedBox(height: AppSpacing.xs),
                      TextField(
                        controller: _descriptionController,
                        readOnly: !isAdmin,
                        style: TextStyle(color: titleColor, fontSize: 13),
                        maxLines: 5,
                        minLines: 3,
                        decoration: _inputDecoration(
                          hint: 'Add a description...',
                          isDark: isDark,
                          hintColor: hintColor,
                          borderColor: borderColor,
                        ),
                        onChanged: isAdmin
                            ? (_) => setState(() => _isDirty = true)
                            : null,
                      ),
                      const SizedBox(height: AppSpacing.xl),

                      // Status & Priority side by side
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _SectionLabel(
                                  label: 'Status',
                                  color: labelColor,
                                ),
                                const SizedBox(height: AppSpacing.xs),
                                _StatusDropdown(
                                  value: _status,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  titleColor: titleColor,
                                  isAdmin: isAdmin,
                                  onChanged: (status) {
                                    if (status != null) {
                                      setState(() {
                                        _status = status;
                                        _isDirty = true;
                                      });
                                    }
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: AppSpacing.lg),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _SectionLabel(
                                  label: 'Priority',
                                  color: labelColor,
                                ),
                                const SizedBox(height: AppSpacing.xs),
                                _PriorityDropdown(
                                  value: _priority,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  titleColor: titleColor,
                                  enabled: isAdmin,
                                  onChanged: isAdmin
                                      ? (priority) {
                                          if (priority != null) {
                                            setState(() {
                                              _priority = priority;
                                              _isDirty = true;
                                            });
                                          }
                                        }
                                      : null,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xl),

                      // Assignee
                      _SectionLabel(label: 'Assignee', color: labelColor),
                      const SizedBox(height: AppSpacing.xs),
                      if (isAdmin)
                        _AssigneePicker(
                          projectId: widget.projectId,
                          selectedId: _assigneeId,
                          isDark: isDark,
                          borderColor: borderColor,
                          titleColor: titleColor,
                          hintColor: hintColor,
                          onChanged: _onAssigneeChanged,
                        )
                      else if (_assigneeId == null)
                        _SelfAssignButton(
                          isDark: isDark,
                          borderColor: borderColor,
                          hintColor: hintColor,
                          onAssign: () async {
                            try {
                              final updated = await ref
                                  .read(boardTasksProvider(widget.projectId).notifier)
                                  .assignSelf(widget.task.id);
                              setState(() {
                                _assigneeId = updated.assigneeId;
                                _assigneeName = updated.assigneeName;
                              });
                              ref.read(selectedTaskProvider.notifier).state = updated;
                              if (!mounted) return;
                              AppToast.success(context, 'Tâche assignée');
                            } catch (_) {
                              if (!mounted) return;
                              AppToast.error(context, 'Échec de l\'assignation');
                            }
                          },
                        )
                      else
                        _AssigneeReadOnly(
                          assigneeName: _assigneeName,
                          borderColor: borderColor,
                          titleColor: titleColor,
                          hintColor: hintColor,
                        ),
                      const SizedBox(height: AppSpacing.xl),

                      // Labels
                      _SectionLabel(label: 'Labels', color: labelColor),
                      const SizedBox(height: AppSpacing.xs),
                      if (_labels.isNotEmpty)
                        Wrap(
                          spacing: AppSpacing.xs,
                          runSpacing: AppSpacing.xs,
                          children: _labels
                              .map(
                                (label) => Chip(
                                  label: Text(
                                    label,
                                    style: TextStyle(
                                      color: labelColor,
                                      fontSize: 12,
                                    ),
                                  ),
                                  deleteIcon: isAdmin
                                      ? Icon(
                                          Icons.close,
                                          size: 14,
                                          color: hintColor,
                                        )
                                      : null,
                                  onDeleted: isAdmin
                                      ? () => _removeLabel(label)
                                      : null,
                                  backgroundColor: isDark
                                      ? AppColors.surfaceDark
                                      : AppColors.hoverLight,
                                  side: BorderSide(color: borderColor),
                                  visualDensity: VisualDensity.compact,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: AppSpacing.xs,
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      if (isAdmin) ...[
                        const SizedBox(height: AppSpacing.sm),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _labelInputController,
                                style: TextStyle(color: titleColor, fontSize: 13),
                                decoration: _inputDecoration(
                                  hint: 'Add a label...',
                                  isDark: isDark,
                                  hintColor: hintColor,
                                  borderColor: borderColor,
                                ),
                                onSubmitted: _addLabel,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            _HeaderIconButton(
                              onTap: () => _addLabel(_labelInputController.text),
                              icon: Icons.add_rounded,
                              color: AppColors.primary,
                              hoverColor: AppColors.primary.withOpacity(0.1),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: AppSpacing.xl),

                      // Due Date
                      _SectionLabel(label: 'Due Date', color: labelColor),
                      const SizedBox(height: AppSpacing.xs),
                      GestureDetector(
                        onTap: isAdmin
                            ? () async {
                                final date = await showDatePicker(
                                  context: context,
                                  initialDate: _dueDate ?? DateTime.now(),
                                  firstDate: DateTime.now().subtract(
                                    const Duration(days: 365),
                                  ),
                                  lastDate: DateTime.now().add(
                                    const Duration(days: 365 * 3),
                                  ),
                                );
                                if (date != null) {
                                  setState(() {
                                    _dueDate = date;
                                    _isDirty = true;
                                  });
                                }
                              }
                            : null,
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.md,
                            vertical: AppSpacing.md,
                          ),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(
                              AppSpacing.radiusMd,
                            ),
                            border: Border.all(color: borderColor),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.calendar_today_rounded,
                                size: 14,
                                color: hintColor,
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Text(
                                  _dueDate != null
                                      ? _formatDate(_dueDate!)
                                      : 'No due date',
                                  style: TextStyle(
                                    color: _dueDate != null
                                        ? titleColor
                                        : hintColor,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                              if (_dueDate != null && isAdmin)
                                GestureDetector(
                                  onTap: () => setState(() {
                                    _dueDate = null;
                                    _isDirty = true;
                                  }),
                                  child: Icon(
                                    Icons.close_rounded,
                                    size: 14,
                                    color: hintColor,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),

                      if (widget.task.githubBranch != null) ...[
                        const SizedBox(height: AppSpacing.xl),
                        _SectionLabel(label: 'GitHub Branch', color: labelColor),
                        const SizedBox(height: AppSpacing.xs),
                        _GitHubBranchRow(
                          branch: widget.task.githubBranch!,
                          isDark: isDark,
                          borderColor: borderColor,
                          titleColor: titleColor,
                          hintColor: hintColor,
                        ),
                      ],

                      const SizedBox(height: AppSpacing.xxxl),
                      Text(
                        'Created ${_formatDate(widget.task.createdAt)}',
                        style: TextStyle(color: hintColor, fontSize: 11),
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        'Updated ${_formatDate(widget.task.updatedAt)}',
                        style: TextStyle(color: hintColor, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ),

              // Footer — save button (visible when dirty)
              if (_isDirty) ...[
                Divider(color: borderColor, height: 1),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: SizedBox(
                    width: double.infinity,
                    child: AppButton(
                      label: 'Save Changes',
                      isLoading: _isSaving,
                      onPressed: _isSaving ? null : () => _saveChanges(isAdmin),
                      size: AppButtonSize.lg,
                    ),
                  ),
                ),
              ],
            ],
          ),
            ),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Assignee Picker (admin)
// =============================================================================

class _AssigneePicker extends ConsumerWidget {
  const _AssigneePicker({
    required this.projectId,
    required this.selectedId,
    required this.isDark,
    required this.borderColor,
    required this.titleColor,
    required this.hintColor,
    required this.onChanged,
  });

  final String projectId;
  final String? selectedId;
  final bool isDark;
  final Color borderColor;
  final Color titleColor;
  final Color hintColor;
  final ValueChanged<ProjectMemberModel?> onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(projectMembersProvider(projectId));

    return membersAsync.when(
      loading: () => Container(
        height: 44,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(color: borderColor),
        ),
        child: Center(
          child: SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2, color: hintColor),
          ),
        ),
      ),
      error: (_, __) => Container(
        height: 44,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(color: borderColor),
        ),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        child: Text(
          'Failed to load members',
          style: TextStyle(color: AppColors.error, fontSize: 13),
        ),
      ),
      data: (members) {
        final selected =
            members.where((m) => m.userId == selectedId).firstOrNull;

        return Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(color: borderColor),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<ProjectMemberModel?>(
              value: selected,
              isExpanded: true,
              icon: Icon(Icons.expand_more_rounded, size: 18, color: hintColor),
              hint: Text(
                'Unassigned',
                style: TextStyle(color: hintColor, fontSize: 13),
              ),
              items: [
                DropdownMenuItem<ProjectMemberModel?>(
                  value: null,
                  child: Text(
                    'Unassigned',
                    style: TextStyle(color: hintColor, fontSize: 13),
                  ),
                ),
                ...members.map(
                  (member) => DropdownMenuItem<ProjectMemberModel?>(
                    value: member,
                    child: Row(
                      children: [
                        UserAvatar(
                          name: member.user.name,
                          avatarUrl: member.user.avatarUrl,
                          radius: 12,
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Text(
                            member.user.name,
                            style:
                                TextStyle(color: titleColor, fontSize: 13),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              onChanged: onChanged,
            ),
          ),
        );
      },
    );
  }
}

// =============================================================================
// Self-assign button (non-admin, unassigned task)
// =============================================================================

class _SelfAssignButton extends StatelessWidget {
  const _SelfAssignButton({
    required this.isDark,
    required this.borderColor,
    required this.hintColor,
    required this.onAssign,
  });

  final bool isDark;
  final Color borderColor;
  final Color hintColor;
  final VoidCallback onAssign;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onAssign,
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.md,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(color: AppColors.primary.withOpacity(0.5)),
            color: AppColors.primary.withOpacity(0.06),
          ),
          child: Row(
            children: [
              Icon(Icons.person_add_rounded, size: 14, color: AppColors.primary),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'S\'assigner cette tâche',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Assignee Read-Only (non-admin)
// =============================================================================

class _AssigneeReadOnly extends StatelessWidget {
  const _AssigneeReadOnly({
    required this.assigneeName,
    required this.borderColor,
    required this.titleColor,
    required this.hintColor,
  });

  final String? assigneeName;
  final Color borderColor;
  final Color titleColor;
  final Color hintColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: borderColor),
      ),
      child: Text(
        assigneeName ?? 'Unassigned',
        style: TextStyle(
          color: assigneeName != null ? titleColor : hintColor,
          fontSize: 13,
        ),
      ),
    );
  }
}


// =============================================================================
// Section Label
// =============================================================================

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label, required this.color});
  final String label;
  final Color color;
  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: TextStyle(
        color: color,
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.1,
      ),
    );
  }
}

// =============================================================================
// Header Icon Button (no ripple)
// =============================================================================

class _HeaderIconButton extends StatefulWidget {
  const _HeaderIconButton({
    required this.onTap,
    required this.icon,
    required this.color,
    this.hoverColor,
  });

  final VoidCallback onTap;
  final IconData icon;
  final Color color;
  final Color? hoverColor;

  @override
  State<_HeaderIconButton> createState() => _HeaderIconButtonState();
}

class _HeaderIconButtonState extends State<_HeaderIconButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: _hovered
                ? (widget.hoverColor ?? Colors.black.withOpacity(0.06))
                : Colors.transparent,
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          ),
          child: Icon(widget.icon, size: 17, color: widget.color),
        ),
      ),
    );
  }
}

// =============================================================================
// Status Dropdown
// =============================================================================

class _StatusDropdown extends StatelessWidget {
  const _StatusDropdown({
    required this.value,
    required this.isDark,
    required this.borderColor,
    required this.titleColor,
    required this.isAdmin,
    required this.onChanged,
  });
  final TaskStatus value;
  final bool isDark;
  final Color borderColor;
  final Color titleColor;
  final bool isAdmin;
  final ValueChanged<TaskStatus?>? onChanged;

  Color _colorForStatus(TaskStatus status) => switch (status) {
        TaskStatus.todo => AppColors.kanbanTodo,
        TaskStatus.inProgress => AppColors.kanbanInProgress,
        TaskStatus.inReview => AppColors.kanbanReview,
        TaskStatus.done => AppColors.kanbanDone,
      };

  String _labelForStatus(TaskStatus status) => switch (status) {
        TaskStatus.todo => 'To Do',
        TaskStatus.inProgress => 'In Progress',
        TaskStatus.inReview => 'In Review',
        TaskStatus.done => 'Done',
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: borderColor),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<TaskStatus>(
          value: value,
          isExpanded: true,
          icon: Icon(
            Icons.expand_more_rounded,
            size: 18,
            color: isDark
                ? AppColors.textTertiaryDark
                : AppColors.textTertiaryLight,
          ),
          items: TaskStatus.values
              .where((s) => isAdmin || s != TaskStatus.done || s == value)
              .map(
                (status) => DropdownMenuItem(
                  value: status,
                  child: Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _colorForStatus(status),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        _labelForStatus(status),
                        style: TextStyle(color: titleColor, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

// =============================================================================
// Priority Dropdown
// =============================================================================

class _PriorityDropdown extends StatelessWidget {
  const _PriorityDropdown({
    required this.value,
    required this.isDark,
    required this.borderColor,
    required this.titleColor,
    required this.enabled,
    required this.onChanged,
  });
  final TaskPriority value;
  final bool isDark;
  final Color borderColor;
  final Color titleColor;
  final bool enabled;
  final ValueChanged<TaskPriority?>? onChanged;

  Color _colorForPriority(TaskPriority p) => switch (p) {
        TaskPriority.urgent => AppColors.priorityUrgent,
        TaskPriority.high => AppColors.priorityHigh,
        TaskPriority.medium => AppColors.priorityMedium,
        TaskPriority.low => AppColors.priorityLow,
      };

  String _labelForPriority(TaskPriority p) => switch (p) {
        TaskPriority.urgent => 'Urgent',
        TaskPriority.high => 'High',
        TaskPriority.medium => 'Medium',
        TaskPriority.low => 'Low',
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: borderColor),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<TaskPriority>(
          value: value,
          isExpanded: true,
          icon: Icon(
            Icons.expand_more_rounded,
            size: 18,
            color: isDark
                ? AppColors.textTertiaryDark
                : AppColors.textTertiaryLight,
          ),
          items: TaskPriority.values
              .map(
                (p) => DropdownMenuItem(
                  value: p,
                  child: Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _colorForPriority(p),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        _labelForPriority(p),
                        style: TextStyle(color: titleColor, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
          onChanged: enabled ? onChanged : null,
        ),
      ),
    );
  }
}

// =============================================================================
// Identifier Badge (header)
// =============================================================================

class _IdentifierBadge extends StatelessWidget {
  const _IdentifierBadge({required this.identifier, required this.isDark});

  final String identifier;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.hoverLight,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
          width: 0.8,
        ),
      ),
      child: Text(
        identifier,
        style: TextStyle(
          color: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
          fontFamily: 'monospace',
        ),
      ),
    );
  }
}

// =============================================================================
// GitHub Branch Row
// =============================================================================

class _GitHubBranchRow extends ConsumerWidget {
  const _GitHubBranchRow({
    required this.branch,
    required this.isDark,
    required this.borderColor,
    required this.titleColor,
    required this.hintColor,
  });

  final String branch;
  final bool isDark;
  final Color borderColor;
  final Color titleColor;
  final Color hintColor;

  Future<void> _copyBranch(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: branch));
    if (!context.mounted) return;
    AppToast.success(context, 'Branche copiée');
  }

  Future<void> _openOnGitHub(BuildContext context, WidgetRef ref) async {
    final project = ref.read(selectedProjectProvider);
    if (project == null || !project.hasGithubRepo) {
      if (!context.mounted) return;
      AppToast.error(context, 'Aucun dépôt GitHub lié au projet');
      return;
    }
    final uri = Uri.parse(
      'https://github.com/${project.githubOwner}/${project.githubRepo}/tree/$branch',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: borderColor),
        color: isDark
            ? const Color(0xFF24292F).withOpacity(0.4)
            : const Color(0xFFF6F8FA),
      ),
      child: Row(
        children: [
          Icon(Icons.call_split_rounded, size: 14, color: hintColor),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              branch,
              style: TextStyle(
                color: titleColor,
                fontSize: 12,
                fontFamily: 'monospace',
                fontWeight: FontWeight.w500,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          _BranchActionButton(
            icon: Icons.copy_rounded,
            tooltip: 'Copier la branche',
            color: hintColor,
            onTap: () => _copyBranch(context),
          ),
          const SizedBox(width: AppSpacing.xs),
          _BranchActionButton(
            icon: Icons.open_in_new_rounded,
            tooltip: 'Ouvrir sur GitHub',
            color: hintColor,
            onTap: () => _openOnGitHub(context, ref),
          ),
        ],
      ),
    );
  }
}

class _BranchActionButton extends StatefulWidget {
  const _BranchActionButton({
    required this.icon,
    required this.tooltip,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final Color color;
  final VoidCallback onTap;

  @override
  State<_BranchActionButton> createState() => _BranchActionButtonState();
}

class _BranchActionButtonState extends State<_BranchActionButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: widget.tooltip,
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        onEnter: (_) => setState(() => _hovered = true),
        onExit: (_) => setState(() => _hovered = false),
        child: GestureDetector(
          onTap: widget.onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 120),
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              color: _hovered
                  ? Colors.black.withOpacity(0.06)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Icon(widget.icon, size: 14, color: widget.color),
          ),
        ),
      ),
    );
  }
}
