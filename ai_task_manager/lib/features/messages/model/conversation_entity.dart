import 'package:equatable/equatable.dart';

class MemberSummary extends Equatable {
  final String id;
  final String name;
  final String? avatarUrl;

  const MemberSummary({
    required this.id,
    required this.name,
    this.avatarUrl,
  });

  @override
  List<Object?> get props => [id, name, avatarUrl];
}

class MessageSummary extends Equatable {
  final String content;
  final String senderName;
  final DateTime createdAt;

  const MessageSummary({
    required this.content,
    required this.senderName,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [content, senderName, createdAt];
}

class ConversationEntity extends Equatable {
  final String id;
  final String? name;
  final bool isGroup;
  final List<MemberSummary> members;
  final MessageSummary? lastMessage;
  final int unreadCount;

  const ConversationEntity({
    required this.id,
    this.name,
    required this.isGroup,
    required this.members,
    this.lastMessage,
    this.unreadCount = 0,
  });

  ConversationEntity copyWith({
    String? id,
    String? name,
    bool? isGroup,
    List<MemberSummary>? members,
    MessageSummary? lastMessage,
    int? unreadCount,
  }) {
    return ConversationEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      isGroup: isGroup ?? this.isGroup,
      members: members ?? this.members,
      lastMessage: lastMessage ?? this.lastMessage,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }

  @override
  List<Object?> get props => [id, name, isGroup, members, lastMessage, unreadCount];
}
