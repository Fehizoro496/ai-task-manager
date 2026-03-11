import 'package:json_annotation/json_annotation.dart';

import 'package:ai_task_manager/core/utils/typedefs.dart';

part 'admin_user_model.g.dart';

@JsonSerializable()
class AdminUserModel {
  final String id;
  final String email;
  final String name;
  final String? avatarUrl;
  final String provider;
  final String role;
  final String status;
  final DateTime createdAt;

  const AdminUserModel({
    required this.id,
    required this.email,
    required this.name,
    this.avatarUrl,
    required this.provider,
    required this.role,
    required this.status,
    required this.createdAt,
  });

  factory AdminUserModel.fromJson(DataMap json) =>
      _$AdminUserModelFromJson(json);

  DataMap toJson() => _$AdminUserModelToJson(this);

  bool get isPending => status == 'PENDING';
  bool get isApproved => status == 'APPROVED';
  bool get isRejected => status == 'REJECTED';
  bool get isAdmin => role == 'ADMIN';
}
