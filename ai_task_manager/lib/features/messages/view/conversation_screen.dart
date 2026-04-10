import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'package:ai_task_manager/core/theme/app_colors.dart';
import 'package:ai_task_manager/core/theme/app_spacing.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';
import 'package:ai_task_manager/features/messages/model/conversation_entity.dart';
import 'package:ai_task_manager/features/messages/model/message_entity.dart';
import 'package:ai_task_manager/features/messages/viewmodel/chat_viewmodel.dart';
import 'package:ai_task_manager/shared/user_avatar.dart';

class ConversationScreen extends ConsumerStatefulWidget {
  final String conversationId;

  const ConversationScreen({super.key, required this.conversationId});

  @override
  ConsumerState<ConversationScreen> createState() =>
      _ConversationScreenState();
}

class _ConversationScreenState extends ConsumerState<ConversationScreen> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  bool _sending = false;

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final content = _textController.text.trim();
    if (content.isEmpty || _sending) return;
    setState(() => _sending = true);
    _textController.clear();
    try {
      await ref
          .read(messagesProvider(widget.conversationId).notifier)
          .sendMessage(content);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  String _getConvTitle(List<ConversationEntity> conversations, String? userId) {
    final conv = conversations.firstWhere(
      (c) => c.id == widget.conversationId,
      orElse: () => const ConversationEntity(
        id: '',
        isGroup: false,
        members: [],
      ),
    );
    if (conv.isGroup) return conv.name ?? 'Groupe';
    if (userId == null) return 'Conversation';
    final other = conv.members.firstWhere(
      (m) => m.id != userId,
      orElse: () => conv.members.isNotEmpty
          ? conv.members.first
          : const MemberSummary(id: '', name: 'Inconnu'),
    );
    return other.name;
  }

  ConversationEntity? _getConversation(List<ConversationEntity> conversations) {
    try {
      return conversations.firstWhere((c) => c.id == widget.conversationId);
    } catch (_) {
      return null;
    }
  }

  Widget _buildAppBarAvatar(ConversationEntity? conv, String? currentUserId) {
    if (conv == null) return const SizedBox.shrink();
    if (conv.isGroup) {
      return Container(
        width: 36,
        height: 36,
        decoration: const BoxDecoration(
          color: AppColors.primarySurface,
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.group_rounded, size: 18, color: AppColors.primary),
      );
    }
    final other = conv.members.firstWhere(
      (m) => m.id != currentUserId,
      orElse: () => conv.members.isNotEmpty
          ? conv.members.first
          : const MemberSummary(id: '', name: '?'),
    );
    return UserAvatar(name: other.name, avatarUrl: other.avatarUrl, radius: 18);
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(messagesProvider(widget.conversationId));
    final conversationsAsync = ref.watch(conversationsProvider);
    final authState = ref.watch(authStateProvider);
    final currentUserId = authState.valueOrNull?.id;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final conversations = conversationsAsync.valueOrNull;
    final conv = conversations != null ? _getConversation(conversations) : null;
    final isGroup = conv?.isGroup ?? false;

    final convTitle = conversations != null
        ? _getConvTitle(conversations, currentUserId)
        : 'Conversation';

    messagesAsync.whenData((_) => _scrollToBottom());

    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: () => context.go('/messages')),
        title: Row(
          children: [
            _buildAppBarAvatar(conv, currentUserId),
            const SizedBox(width: AppSpacing.sm),
            Text(convTitle),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              data: (messages) {
                if (messages.isEmpty) {
                  return Center(
                    child: Text(
                      'Aucun message. Commencez la conversation !',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: isDark
                                ? AppColors.textSecondaryDark
                                : AppColors.textSecondaryLight,
                          ),
                    ),
                  );
                }
                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.sm,
                  ),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final msg = messages[index];
                    final isMe = msg.senderId == currentUserId;
                    final showSender = !isMe &&
                        (index == 0 ||
                            messages[index - 1].senderId != msg.senderId);
                    return _MessageBubble(
                      message: msg,
                      isMe: isMe,
                      isGroup: isGroup,
                      showSender: showSender,
                      isDark: isDark,
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(
                child: Text('Erreur: $error'),
              ),
            ),
          ),
          _buildInputBar(isDark),
        ],
      ),
    );
  }

  Widget _buildInputBar(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _textController,
              minLines: 1,
              maxLines: 4,
              textInputAction: TextInputAction.newline,
              decoration: InputDecoration(
                hintText: 'Votre message...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
                  borderSide: BorderSide(
                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.sm,
                ),
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          _sending
              ? const SizedBox(
                  width: 40,
                  height: 40,
                  child: Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                )
              : IconButton(
                  onPressed: _sendMessage,
                  icon: const Icon(Icons.send_rounded),
                  color: AppColors.primary,
                  tooltip: 'Envoyer',
                ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final MessageEntity message;
  final bool isMe;
  final bool isGroup;
  final bool showSender;
  final bool isDark;

  const _MessageBubble({
    required this.message,
    required this.isMe,
    required this.isGroup,
    required this.showSender,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final bubbleColor = isMe
        ? AppColors.primary
        : (isDark ? AppColors.cardDark : AppColors.hoverLight);

    final textColor = isMe
        ? Colors.white
        : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight);

    const double avatarDiameter = 28;
    final showAvatar = isGroup && !isMe;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Row(
        mainAxisAlignment:
            isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showAvatar)
            showSender
                ? Padding(
                    padding: const EdgeInsets.only(right: AppSpacing.xs),
                    child: UserAvatar(
                      name: message.senderName,
                      avatarUrl: message.senderAvatarUrl,
                      radius: avatarDiameter / 2,
                    ),
                  )
                : const SizedBox(width: avatarDiameter + AppSpacing.xs),
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.65,
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
              decoration: BoxDecoration(
                color: bubbleColor,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(AppSpacing.radiusLg),
                  topRight: const Radius.circular(AppSpacing.radiusLg),
                  bottomLeft: Radius.circular(
                      isMe ? AppSpacing.radiusLg : AppSpacing.radiusSm),
                  bottomRight: Radius.circular(
                      isMe ? AppSpacing.radiusSm : AppSpacing.radiusLg),
                ),
              ),
              child: Column(
                crossAxisAlignment:
                    isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  if (isGroup && !isMe && showSender) ...[
                    Text(
                      message.senderName,
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.1,
                      ),
                    ),
                    const SizedBox(height: 3),
                  ],
                  Text(
                    message.content,
                    style: TextStyle(color: textColor, fontSize: 14),
                  ),
                  const SizedBox(height: AppSpacing.xxs),
                  Text(
                    DateFormat('HH:mm').format(message.createdAt.toLocal()),
                    style: TextStyle(
                      color: textColor.withValues(alpha: 0.65),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isMe) const SizedBox(width: AppSpacing.xs),
        ],
      ),
    );
  }
}
