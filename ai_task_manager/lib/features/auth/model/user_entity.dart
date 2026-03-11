import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final String id;
  final String email;
  final String name;
  final String? avatarUrl;
  final String? token;
  final String? role;
  final String? status;

  const UserEntity({
    required this.id,
    required this.email,
    required this.name,
    this.avatarUrl,
    this.token,
    this.role,
    this.status,
  });

  bool get isAdmin => role == 'ADMIN';
  bool get isPending => status == 'PENDING';
  bool get isApproved => status == 'APPROVED';
  bool get isRejected => status == 'REJECTED';

  @override
  List<Object?> get props => [id, email, name, avatarUrl, token, role, status];
}
