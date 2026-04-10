import 'package:ai_task_manager/features/messages/model/message_entity.dart';

class MessageModel extends MessageEntity {
  const MessageModel({
    required super.id,
    required super.conversationId,
    required super.content,
    required super.senderId,
    required super.senderName,
    super.senderAvatarUrl,
    required super.createdAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      content: json['content'] as String,
      senderId: json['senderId'] as String,
      senderName: json['senderName'] as String,
      senderAvatarUrl: json['sender_avatar_url'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
