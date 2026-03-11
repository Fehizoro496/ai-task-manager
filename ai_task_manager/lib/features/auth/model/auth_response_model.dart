import 'package:json_annotation/json_annotation.dart';

import 'package:ai_task_manager/core/utils/typedefs.dart';
import 'package:ai_task_manager/features/auth/model/user_model.dart';

part 'auth_response_model.g.dart';

@JsonSerializable()
class AuthResponseModel {
  final UserModel user;
  final String? token;

  const AuthResponseModel({
    required this.user,
    this.token,
  });

  factory AuthResponseModel.fromJson(DataMap json) =>
      _$AuthResponseModelFromJson(json);

  DataMap toJson() => _$AuthResponseModelToJson(this);

  bool get hasPendingApproval => token == null;

  /// Returns a [UserModel] with the token attached (only when token is present).
  UserModel get userWithToken => user.copyWith(token: token);
}
