import 'package:json_annotation/json_annotation.dart';

import 'package:ai_task_manager/core/utils/typedefs.dart';
import 'package:ai_task_manager/features/auth/model/user_entity.dart';

part 'user_model.g.dart';

@JsonSerializable(fieldRename: FieldRename.snake)
class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.email,
    required super.name,
    super.avatarUrl,
    super.token,
  });

  factory UserModel.fromJson(DataMap json) => _$UserModelFromJson(json);

  DataMap toJson() => _$UserModelToJson(this);

  factory UserModel.fromEntity(UserEntity entity) {
    return UserModel(
      id: entity.id,
      email: entity.email,
      name: entity.name,
      avatarUrl: entity.avatarUrl,
      token: entity.token,
    );
  }

  UserModel copyWith({
    String? id,
    String? email,
    String? name,
    String? avatarUrl,
    String? token,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      token: token ?? this.token,
    );
  }
}
