import 'package:equatable/equatable.dart';

class MessageEntity extends Equatable {
  final String id;
  final String conversationId;
  final String content;
  final String senderId;
  final String senderName;
  final String? senderAvatarUrl;
  final DateTime createdAt;

  const MessageEntity({
    required this.id,
    required this.conversationId,
    required this.content,
    required this.senderId,
    required this.senderName,
    this.senderAvatarUrl,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        conversationId,
        content,
        senderId,
        senderName,
        senderAvatarUrl,
        createdAt,
      ];
}
