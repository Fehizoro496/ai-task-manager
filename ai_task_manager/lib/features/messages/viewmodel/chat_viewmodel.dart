import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
    if (aDate == null) return 1;   // sans message → fin de liste
    if (bDate == null) return -1;  // sans message → fin de liste
    return bDate.compareTo(aDate); // plus récent en premier
  });
  return sorted;
}

// ─── Providers infrastructure ────────────────────────────────────────────────

final chatServiceProvider = Provider<ChatService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ChatService(apiClient: apiClient);
});

String _lastReadKey(String convId) => 'chat_last_read_$convId';

int _computeUnread(
  List<MessageEntity> messages,
  String currentUserId,
  DateTime? lastRead,
) {
  if (lastRead == null) {
    return messages.where((m) => m.senderId != currentUserId).length;
  }
  return messages
      .where((m) =>
          m.senderId != currentUserId && m.createdAt.isAfter(lastRead))
      .length;
}

// ─── Conversations ────────────────────────────────────────────────────────────

final conversationsProvider = AsyncNotifierProvider<ConversationsViewModel,
    List<ConversationEntity>>(ConversationsViewModel.new);

class ConversationsViewModel
    extends AsyncNotifier<List<ConversationEntity>> {
  StreamSubscription<Map<String, dynamic>>? _sub;

  @override
  Future<List<ConversationEntity>> build() async {
    final prefs = ref.read(sharedPreferencesProvider);
    if (prefs.getString(kCachedAuthTokenKey) == null) return [];

    final conversations =
        await ref.read(chatServiceProvider).getConversations();

    // Calculer unreadCount depuis SharedPreferences
    final withUnread = await _attachUnreadCounts(conversations, prefs);

    // Écouter les nouveaux messages socket pour mettre à jour lastMessage
    _sub?.cancel();
    _sub = ref
        .read(socketServiceProvider)
        .onAnyMessage()
        .listen(_onSocketMessage);

    ref.onDispose(() => _sub?.cancel());

    return _sortedByLastMessage(withUnread);
  }

  Future<List<ConversationEntity>> _attachUnreadCounts(
    List<ConversationEntity> conversations,
    SharedPreferences prefs,
  ) async {
    // On ne peut pas calculer le unread sans récupérer les messages,
    // donc on utilise lastMessage.createdAt comme proxy simple :
    // unread = 1 si lastMessage existe et createdAt > lastRead, sinon 0.
    return conversations.map((c) {
      final lastReadStr = prefs.getString(_lastReadKey(c.id));
      if (lastReadStr == null || c.lastMessage == null) {
        return c.copyWith(unreadCount: 0);
      }
      final lastRead = DateTime.tryParse(lastReadStr);
      if (lastRead == null) return c.copyWith(unreadCount: 0);
      final isUnread = c.lastMessage!.createdAt.isAfter(lastRead);
      return c.copyWith(unreadCount: isUnread ? 1 : 0);
    }).toList();
  }

  void _onSocketMessage(Map<String, dynamic> data) {
    final current = state.valueOrNull;
    if (current == null) return;
    final convId = data['conversationId'] as String?;
    if (convId == null) return;

    final prefs = ref.read(sharedPreferencesProvider);
    final lastReadStr = prefs.getString(_lastReadKey(convId));
    final lastRead =
        lastReadStr != null ? DateTime.tryParse(lastReadStr) : null;
    final msgDate = DateTime.tryParse(data['createdAt'] as String? ?? '');

    final updated = current.map((c) {
      if (c.id != convId) return c;
      final newLastMessage = MessageSummary(
        content: data['content'] as String? ?? '',
        senderName: data['senderName'] as String? ?? '',
        createdAt: msgDate ?? DateTime.now(),
      );
      final isUnread = lastRead == null ||
          (msgDate != null && msgDate.isAfter(lastRead));
      return c.copyWith(
        lastMessage: newLastMessage,
        unreadCount: isUnread ? c.unreadCount + 1 : c.unreadCount,
      );
    }).toList();
    state = AsyncData(_sortedByLastMessage(updated));
  }

  Future<ConversationEntity> createDM(String otherUserId) async {
    final conv =
        await ref.read(chatServiceProvider).createDM(otherUserId);
    final current = state.valueOrNull ?? [];
    final exists = current.any((c) => c.id == conv.id);
    if (!exists) {
      state = AsyncData(_sortedByLastMessage([conv, ...current]));
    }
    return conv;
  }

  void markRead(String convId) {
    final prefs = ref.read(sharedPreferencesProvider);
    prefs.setString(_lastReadKey(convId), DateTime.now().toIso8601String());

    final current = state.valueOrNull;
    if (current == null) return;
    state = AsyncData(current.map((c) {
      if (c.id != convId) return c;
      return c.copyWith(unreadCount: 0);
    }).toList());
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

final messagesProvider = AsyncNotifierProviderFamily<MessagesViewModel,
    List<MessageEntity>, String>(MessagesViewModel.new);

class MessagesViewModel
    extends FamilyAsyncNotifier<List<MessageEntity>, String> {
  StreamSubscription<Map<String, dynamic>>? _sub;

  @override
  Future<List<MessageEntity>> build(String conversationId) async {
    final prefs = ref.read(sharedPreferencesProvider);
    if (prefs.getString(kCachedAuthTokenKey) == null) return [];

    final messages =
        await ref.read(chatServiceProvider).getMessages(conversationId);

    // Rejoindre la room socket
    ref.read(socketServiceProvider).joinConversation(conversationId);

    // Marquer comme lu
    ref
        .read(conversationsProvider.notifier)
        .markRead(conversationId);

    // Écouter les nouveaux messages
    _sub?.cancel();
    _sub = ref
        .read(socketServiceProvider)
        .onNewMessage(conversationId)
        .listen(_onNewMessage);

    ref.onDispose(() {
      _sub?.cancel();
      ref
          .read(socketServiceProvider)
          .leaveConversation(conversationId);
    });

    return messages;
  }

  void _onNewMessage(Map<String, dynamic> data) {
    final current = state.valueOrNull ?? [];
    final msg = MessageModel.fromJson(data);
    state = AsyncData([...current, msg]);

    // Marquer comme lu car on est dans la conversation
    ref.read(conversationsProvider.notifier).markRead(arg);
  }

  Future<void> sendMessage(String content) async {
    await ref.read(chatServiceProvider).sendMessage(arg, content);
    // Le socket diffuse aux autres ; pour l'expéditeur, le serveur renvoie
    // le message via l'event socket également.
  }
}
