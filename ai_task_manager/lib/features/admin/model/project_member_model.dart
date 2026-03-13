import 'package:ai_task_manager/core/utils/typedefs.dart';

class ProjectMemberUser {
  final String id;
  final String name;
  final String email;
  final String? avatarUrl;

  const ProjectMemberUser({
    required this.id,
    required this.name,
    required this.email,
    this.avatarUrl,
  });

  factory ProjectMemberUser.fromJson(DataMap json) => ProjectMemberUser(
        id: json['id'] as String,
        name: json['name'] as String,
        email: json['email'] as String,
        avatarUrl: json['avatarUrl'] as String?,
      );
}

class ProjectMemberModel {
  final String id;
  final String projectId;
  final String userId;
  final ProjectMemberUser user;
  final DateTime createdAt;

  const ProjectMemberModel({
    required this.id,
    required this.projectId,
    required this.userId,
    required this.user,
    required this.createdAt,
  });

  factory ProjectMemberModel.fromJson(DataMap json) => ProjectMemberModel(
        id: json['id'] as String,
        projectId: json['projectId'] as String,
        userId: json['userId'] as String,
        user: ProjectMemberUser.fromJson(json['user'] as DataMap),
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
