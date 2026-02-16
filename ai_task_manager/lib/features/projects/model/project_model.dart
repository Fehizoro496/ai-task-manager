import 'package:json_annotation/json_annotation.dart';

import 'package:ai_task_manager/core/utils/typedefs.dart';
import 'package:ai_task_manager/features/projects/model/project_entity.dart';

part 'project_model.g.dart';

@JsonSerializable()
class ProjectModel extends ProjectEntity {
  const ProjectModel({
    required super.id,
    required super.name,
    super.description,
    super.color,
    required super.ownerId,
    required super.createdAt,
    required super.updatedAt,
  });

  factory ProjectModel.fromJson(DataMap json) => _$ProjectModelFromJson(json);

  DataMap toJson() => _$ProjectModelToJson(this);

  factory ProjectModel.fromEntity(ProjectEntity entity) {
    return ProjectModel(
      id: entity.id,
      name: entity.name,
      description: entity.description,
      color: entity.color,
      ownerId: entity.ownerId,
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
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ProjectModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      color: color ?? this.color,
      ownerId: ownerId ?? this.ownerId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
