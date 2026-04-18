import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'package:ai_task_manager/core/design_system/app_button.dart';
import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';
import 'package:ai_task_manager/features/messages/model/conversation_entity.dart';
import 'package:ai_task_manager/features/messages/viewmodel/chat_viewmodel.dart';
import 'package:ai_task_manager/shared/user_avatar.dart';

class MessagesScreen extends ConsumerWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversationsAsync = ref.watch(conversationsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(context, ref, isDark),
          Expanded(
            child: conversationsAsync.when(
              data: (conversations) {
                if (conversations.isEmpty) {
                  return _buildEmptyState(isDark);
                }
                return RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: () =>
                      ref.read(conversationsProvider.notifier).refresh(),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.xl,
                      AppSpacing.sm,
                      AppSpacing.xl,
                      AppSpacing.xl,
                    ),
                    itemCount: conversations.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AppSpacing.sm),
                    itemBuilder: (context, index) {
                      final conv = conversations[index];
                      return _ConversationTile(
                        conversation: conv,
                        isDark: isDark,
                        onTap: () => context.go('/messages/${conv.id}'),
                      );
                    },
                  ),
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
              error: (error, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline_rounded,
                        size: 48, color: AppColors.error),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      'Failed to load',
                      style: TextStyle(
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    AppButton(
                      label: 'Retry',
                      onPressed: () =>
                          ref.read(conversationsProvider.notifier).refresh(),
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

  Widget _buildHeader(BuildContext context, WidgetRef ref, bool isDark) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF000000).withOpacity(0.80)
                : Colors.white.withOpacity(0.82),
            border: Border(
              bottom: BorderSide(
                color: isDark
                    ? Colors.white.withOpacity(0.08)
                    : Colors.black.withOpacity(0.07),
                width: 1,
              ),
            ),
          ),
          child: Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl, AppSpacing.xl, AppSpacing.md, AppSpacing.sm),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Messages',
                  style: TextStyle(
                    color: isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.56,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Your conversations',
                  style: TextStyle(
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight,
                    fontSize: 13,
                    letterSpacing: -0.1,
                  ),
                ),
              ],
            ),
          ),
          _GhostIconButton(
            icon: Icons.refresh_rounded,
            isDark: isDark,
            tooltip: 'Refresh',
            onTap: () => ref.read(conversationsProvider.notifier).refresh(),
          ),
        ],
          ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.hoverLight,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.chat_bubble_outline_rounded,
              size: 32,
              color: isDark
                  ? AppColors.textTertiaryDark
                  : AppColors.textTertiaryLight,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'No conversations',
            style: TextStyle(
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
              fontSize: 16,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'You\'ll join "general" after approval.',
            style: TextStyle(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
              fontSize: 13,
              letterSpacing: -0.1,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Conversation tile ─────────────────────────────────────────────────────────

class _ConversationTile extends ConsumerStatefulWidget {
  final ConversationEntity conversation;
  final bool isDark;
  final VoidCallback onTap;

  const _ConversationTile({
    required this.conversation,
    required this.isDark,
    required this.onTap,
  });

  @override
  ConsumerState<_ConversationTile> createState() => _ConversationTileState();
}

class _ConversationTileState extends ConsumerState<_ConversationTile> {
  bool _hovered = false;

  String _lastMessagePreview(
      MessageSummary msg, String? currentUserId, bool isGroup) {
    if (msg.senderId == currentUserId) return 'Me: ${msg.content}';
    if (isGroup) return '${msg.senderName}: ${msg.content}';
    return msg.content;
  }

  String _displayName(ConversationEntity conv, String? currentUserId) {
    if (conv.isGroup) return conv.name ?? 'Group';
    final other = conv.members.firstWhere(
      (m) => m.id != currentUserId,
      orElse: () => conv.members.first,
    );
    return other.name;
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final currentUserId = authState.valueOrNull?.id;
    final conv = widget.conversation;
    final isDark = widget.isDark;
    final hasUnread = conv.unreadCount > 0;

    final Color bg = isDark ? AppColors.cardDark : Colors.white;

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: hasUnread
                ? (isDark
                    ? AppColors.primary.withOpacity(_hovered ? 0.16 : 0.12)
                    : AppColors.primary.withOpacity(_hovered ? 0.09 : 0.06))
                : (isDark
                    ? Colors.white.withOpacity(_hovered ? 0.11 : 0.07)
                    : Colors.white.withOpacity(_hovered ? 0.88 : 0.76)),
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(
              color: hasUnread
                  ? AppColors.primary.withOpacity(isDark ? 0.30 : 0.20)
                  : (isDark
                      ? Colors.white.withOpacity(0.10)
                      : Colors.white.withOpacity(0.85)),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.22 : 0.06),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              _buildAvatar(currentUserId),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _displayName(conv, currentUserId),
                            style: TextStyle(
                              fontWeight: hasUnread
                                  ? FontWeight.w600
                                  : FontWeight.w500,
                              color: isDark
                                  ? AppColors.textPrimaryDark
                                  : AppColors.textPrimaryLight,
                              fontSize: 14,
                              letterSpacing: -0.15,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (conv.lastMessage != null)
                          Text(
                            _relativeDate(conv.lastMessage!.createdAt),
                            style: TextStyle(
                              color: isDark
                                  ? AppColors.textTertiaryDark
                                  : AppColors.textTertiaryLight,
                              fontSize: 11,
                              letterSpacing: -0.1,
                            ),
                          ),
                        if (hasUnread) ...[
                          const SizedBox(width: AppSpacing.xs),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius:
                                  BorderRadius.circular(AppSpacing.radiusFull),
                            ),
                            child: Text(
                              conv.unreadCount > 99
                                  ? '99+'
                                  : '${conv.unreadCount}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                height: 1,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (conv.lastMessage != null) ...[
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        _lastMessagePreview(
                            conv.lastMessage!, currentUserId, conv.isGroup),
                        style: TextStyle(
                          color: isDark
                              ? AppColors.textSecondaryDark
                              : AppColors.textSecondaryLight,
                          fontSize: 13,
                          letterSpacing: -0.1,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
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

  Widget _buildAvatar(String? currentUserId) {
    if (widget.conversation.isGroup) {
      return Container(
        width: 40,
        height: 40,
        decoration: const BoxDecoration(
          color: AppColors.primarySurface,
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.group_rounded,
            size: 20, color: AppColors.primary),
      );
    }
    final conv = widget.conversation;
    final other = conv.members.firstWhere(
      (m) => m.id != currentUserId,
      orElse: () => conv.members.isNotEmpty
          ? conv.members.first
          : const MemberSummary(id: '', name: '?'),
    );
    return UserAvatar(name: other.name, avatarUrl: other.avatarUrl, radius: 20);
  }

  String _relativeDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inHours < 1) return '${diff.inMinutes}m';
    if (diff.inDays < 1) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return DateFormat('dd/MM').format(date);
  }
}

// ── Ghost icon button ─────────────────────────────────────────────────────────

class _GhostIconButton extends StatefulWidget {
  const _GhostIconButton({
    required this.icon,
    required this.isDark,
    required this.onTap,
    this.tooltip,
  });

  final IconData icon;
  final bool isDark;
  final VoidCallback onTap;
  final String? tooltip;

  @override
  State<_GhostIconButton> createState() => _GhostIconButtonState();
}

class _GhostIconButtonState extends State<_GhostIconButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: widget.tooltip ?? '',
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        onEnter: (_) => setState(() => _hovered = true),
        onExit: (_) => setState(() => _hovered = false),
        child: GestureDetector(
          onTap: widget.onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 140),
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _hovered
                  ? (widget.isDark
                      ? Colors.white.withOpacity(0.08)
                      : Colors.black.withOpacity(0.05))
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Icon(
              widget.icon,
              size: 18,
              color: widget.isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
        ),
      ),
    );
  }
}
