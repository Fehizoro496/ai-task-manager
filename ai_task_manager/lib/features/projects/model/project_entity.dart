import 'package:equatable/equatable.dart';

class ProjectEntity extends Equatable {
  final String id;
  final String name;
  final String? description;
  final String? color;
  final String ownerId;
  final String? githubRepoUrl;
  final String? githubOwner;
  final String? githubRepo;
  final String identifierPrefix;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ProjectEntity({
    required this.id,
    required this.name,
    this.description,
    this.color,
    required this.ownerId,
    this.githubRepoUrl,
    this.githubOwner,
    this.githubRepo,
    this.identifierPrefix = 'PROJ',
    required this.createdAt,
    required this.updatedAt,
  });

  /// Retourne true si ce projet est lié à un dépôt GitHub.
  bool get hasGithubRepo => githubRepoUrl != null && githubRepoUrl!.isNotEmpty;

  ProjectEntity copyWith({
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
    return ProjectEntity(
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

  @override
  List<Object?> get props => [
        id, name, description, color, ownerId,
        githubRepoUrl, githubOwner, githubRepo, identifierPrefix,
        createdAt, updatedAt,
      ];
}
