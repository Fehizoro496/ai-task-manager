import 'dart:async';

import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/core/network/api_client.dart';
import 'package:ai_task_manager/core/network/socket_service.dart';
import 'package:ai_task_manager/features/messages/model/conversation_entity.dart';
import 'package:ai_task_manager/features/messages/model/message_entity.dart';
import 'package:ai_task_manager/features/messages/model/message_model.dart';
import 'package:ai_task_manager/features/messages/service/chat_service.dart';
import 'package:ai_task_manager/shared/providers.dart';

// ─── Helpers ─────────────────────────────────────────────────────────────────

List<ConversationEntity> _sortedByLastMessage(List<ConversationEntity> list) {
  final sorted = [...list];
  sorted.sort((a, b) {
    final aDate = a.lastMessage?.createdAt;
    final bDate = b.lastMessage?.createdAt;
    if (aDate == null && bDate == null) return 0;
    if (aDate == null) return 1;
    if (bDate == null) return -1;
    return bDate.compareTo(aDate);
  });
  return sorted;
}

// ─── Providers infrastructure ────────────────────────────────────────────────

final chatServiceProvider = Provider<ChatService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ChatService(apiClient: apiClient);
});

// ─── Conversations ────────────────────────────────────────────────────────────

final conversationsProvider =
    AsyncNotifierProvider<ConversationsViewModel, List<ConversationEntity>>(
      ConversationsViewModel.new,
    );

class ConversationsViewModel extends AsyncNotifier<List<ConversationEntity>> {
  StreamSubscription<Map<String, dynamic>>? _sub;

  @override
  Future<List<ConversationEntity>> build() async {
    final prefs = ref.read(sharedPreferencesProvider);
    if (prefs.getString(kCachedAuthTokenKey) == null) return [];

    final conversations = await ref.read(chatServiceProvider).getConversations();

    // unreadCount géré uniquement en mémoire : démarre à 0 au chargement,
    // incrémenté par socket, remis à 0 à l'ouverture de la conversation.
    final initial = conversations
        .map((c) => c.copyWith(unreadCount: 0))
        .toList();

    _sub?.cancel();
    _sub = ref
        .read(socketServiceProvider)
        .messages
        .listen(_onSocketMessage);

    ref.onDispose(() => _sub?.cancel());

    return _sortedByLastMessage(initial);
  }

  void _onSocketMessage(Map<String, dynamic> data) {
    final current = state.valueOrNull;
    if (current == null) return;
    final convId = data['conversationId'] as String?;
    if (convId == null) return;

    final currentUserId = ref.read(authStateProvider).valueOrNull?.id;
    final senderId = data['senderId'] as String?;
    final isUnread = senderId != null && senderId != currentUserId;

    final msgDate = DateTime.tryParse(data['createdAt'] as String? ?? '');

    final updated = current.map((c) {
      if (c.id != convId) return c;
      return c.copyWith(
        lastMessage: MessageSummary(
          content: data['content'] as String? ?? '',
          senderName: data['senderName'] as String? ?? '',
          createdAt: msgDate ?? DateTime.now(),
        ),
        unreadCount: isUnread ? c.unreadCount + 1 : c.unreadCount,
      );
    }).toList();
    state = AsyncData(_sortedByLastMessage(updated));
  }

  Future<ConversationEntity> createDM(String otherUserId) async {
    final conv = await ref.read(chatServiceProvider).createDM(otherUserId);
    final current = state.valueOrNull ?? [];
    final exists = current.any((c) => c.id == conv.id);
    if (!exists) {
      state = AsyncData(_sortedByLastMessage([conv, ...current]));
    }
    return conv;
  }

  void markRead(String convId) {
    final current = state.valueOrNull;
    if (current == null) return;
    state = AsyncData(
      current.map((c) {
        if (c.id != convId) return c;
        return c.copyWith(unreadCount: 0);
      }).toList(),
    );
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
    await future;
  }
}

// ─── Badge total non lus ──────────────────────────────────────────────────────

final unreadMessagesCountProvider = Provider<int>((ref) {
  final conversations = ref.watch(conversationsProvider);
  return conversations.valueOrNull
          ?.fold(0, (sum, c) => (sum ?? 0) + c.unreadCount) ??
      0;
});

// ─── Messages d'une conversation ─────────────────────────────────────────────

final messagesProvider = AsyncNotifierProvider.autoDispose
    .family<MessagesViewModel, List<MessageEntity>, String>(
      MessagesViewModel.new,
    );

class MessagesViewModel
    extends AutoDisposeFamilyAsyncNotifier<List<MessageEntity>, String> {
  StreamSubscription<Map<String, dynamic>>? _sub;

  @override
  Future<List<MessageEntity>> build(String conversationId) async {
    final prefs = ref.read(sharedPreferencesProvider);
    if (prefs.getString(kCachedAuthTokenKey) == null) return [];

    final messages =
        await ref.read(chatServiceProvider).getMessages(conversationId);

    ref.read(socketServiceProvider).joinConversation(conversationId);
    ref.read(conversationsProvider.notifier).markRead(conversationId);

    _sub?.cancel();
    _sub = ref
        .read(socketServiceProvider)
        .messages
        .where((data) => data['conversationId'] == conversationId)
        .listen(_onNewMessage);

    ref.onDispose(() => _sub?.cancel());

    return messages;
  }

  void _onNewMessage(Map<String, dynamic> data) {
    final current = state.valueOrNull ?? [];
    final msg = MessageModel.fromJson(data);
    state = AsyncData([...current, msg]);
    ref.read(conversationsProvider.notifier).markRead(arg);
  }

  Future<void> sendMessage(String content) async {
    await ref.read(chatServiceProvider).sendMessage(arg, content);
  }
}
