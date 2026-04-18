import 'package:ai_task_manager/core/utils/typedefs.dart';
import 'package:ai_task_manager/features/projects/model/project_entity.dart';

class ProjectModel extends ProjectEntity {
  const ProjectModel({
    required super.id,
    required super.name,
    super.description,
    super.color,
    required super.ownerId,
    super.githubRepoUrl,
    super.githubOwner,
    super.githubRepo,
    super.identifierPrefix = 'PROJ',
    required super.createdAt,
    required super.updatedAt,
  });

  factory ProjectModel.fromJson(DataMap json) {
    return ProjectModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      color: json['color'] as String?,
      ownerId: (json['ownerId'] ?? json['owner_id']) as String,
      githubRepoUrl: (json['githubRepoUrl'] ?? json['github_repo_url']) as String?,
      githubOwner: (json['githubOwner'] ?? json['github_owner']) as String?,
      githubRepo: (json['githubRepo'] ?? json['github_repo']) as String?,
      identifierPrefix: (json['identifierPrefix'] ?? json['identifier_prefix'] ?? 'PROJ') as String,
      createdAt: DateTime.parse((json['createdAt'] ?? json['created_at']) as String),
      updatedAt: DateTime.parse((json['updatedAt'] ?? json['updated_at']) as String),
    );
  }

  DataMap toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'color': color,
      'owner_id': ownerId,
      'github_repo_url': githubRepoUrl,
      'github_owner': githubOwner,
      'github_repo': githubRepo,
      'identifier_prefix': identifierPrefix,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  factory ProjectModel.fromEntity(ProjectEntity entity) {
    return ProjectModel(
      id: entity.id,
      name: entity.name,
      description: entity.description,
      color: entity.color,
      ownerId: entity.ownerId,
      githubRepoUrl: entity.githubRepoUrl,
      githubOwner: entity.githubOwner,
      githubRepo: entity.githubRepo,
      identifierPrefix: entity.identifierPrefix,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }

  @override
  ProjectModel copyWith({
    String? id,
    String? name,
    String? description,
    String? color,
    String? ownerId,
    String? githubRepoUrl,
    String? githubOwner,
    String? githubRepo,
    String? identifierPrefix,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ProjectModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      color: color ?? this.color,
      ownerId: ownerId ?? this.ownerId,
      githubRepoUrl: githubRepoUrl ?? this.githubRepoUrl,
      githubOwner: githubOwner ?? this.githubOwner,
      githubRepo: githubRepo ?? this.githubRepo,
      identifierPrefix: identifierPrefix ?? this.identifierPrefix,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
