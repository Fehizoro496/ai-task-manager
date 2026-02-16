import 'package:equatable/equatable.dart';

class ProjectEntity extends Equatable {
  final String id;
  final String name;
  final String? description;
  final String? color;
  final String ownerId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ProjectEntity({
    required this.id,
    required this.name,
    this.description,
    this.color,
    required this.ownerId,
    required this.createdAt,
    required this.updatedAt,
  });

  ProjectEntity copyWith({
    String? id,
    String? name,
    String? description,
    String? color,
    String? ownerId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ProjectEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      color: color ?? this.color,
      ownerId: ownerId ?? this.ownerId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, name, description, color, ownerId, createdAt, updatedAt];
}
