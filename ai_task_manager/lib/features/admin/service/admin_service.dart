import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/network/api_client.dart';
import 'package:ai_task_manager/features/admin/data/admin_api.dart';
import 'package:ai_task_manager/features/admin/model/admin_user_model.dart';
import 'package:ai_task_manager/features/admin/model/project_member_model.dart';

class AdminService {
  final ApiClient _apiClient;

  const AdminService({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<AdminUserModel>> getUsers({String? status}) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        AdminApi.users,
        queryParameters: status != null ? {'status': status} : null,
      );
      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }
      final list = response.data!['users'] as List<dynamic>;
      return list
          .map((e) => AdminUserModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<AdminUserModel> approveUser(String id) async {
    try {
      final response = await _apiClient.patch<Map<String, dynamic>>(
        AdminApi.approve(id),
      );
      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }
      return AdminUserModel.fromJson(
          response.data!['user'] as Map<String, dynamic>);
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<AdminUserModel> rejectUser(String id) async {
    try {
      final response = await _apiClient.patch<Map<String, dynamic>>(
        AdminApi.reject(id),
      );
      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }
      return AdminUserModel.fromJson(
          response.data!['user'] as Map<String, dynamic>);
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<List<ProjectMemberModel>> getProjectMembers(String projectId) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        AdminApi.projectMembers(projectId),
      );
      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }
      final list = response.data!['members'] as List<dynamic>;
      return list
          .map((e) => ProjectMemberModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<ProjectMemberModel> addProjectMember(
      String projectId, String userId) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        AdminApi.projectMembers(projectId),
        data: {'userId': userId},
      );
      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }
      return ProjectMemberModel.fromJson(
          response.data!['member'] as Map<String, dynamic>);
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<void> removeProjectMember(String projectId, String userId) async {
    try {
      await _apiClient.delete<void>(
        AdminApi.removeProjectMember(projectId, userId),
      );
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }
}
