import 'package:ai_task_manager/features/messages/model/conversation_entity.dart';

class ConversationModel extends ConversationEntity {
  const ConversationModel({
    required super.id,
    super.name,
    required super.isGroup,
    required super.members,
    super.lastMessage,
    super.unreadCount = 0,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    final membersList = (json['members'] as List<dynamic>? ?? [])
        .map((m) => MemberSummary(
              id: m['id'] as String,
              name: m['name'] as String,
              avatarUrl: m['avatar_url'] as String?,
            ))
        .toList();

    MessageSummary? lastMessage;
    if (json['lastMessage'] != null) {
      final lm = json['lastMessage'] as Map<String, dynamic>;
      lastMessage = MessageSummary(
        content: lm['content'] as String,
        senderId: lm['senderId'] as String? ?? '',
        senderName: lm['senderName'] as String,
        createdAt: DateTime.parse(lm['createdAt'] as String),
      );
    }

    return ConversationModel(
      id: json['id'] as String,
      name: json['name'] as String?,
      isGroup: json['isGroup'] as bool,
      members: membersList,
      lastMessage: lastMessage,
    );
  }
}
