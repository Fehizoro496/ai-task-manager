import 'package:drift/drift.dart';

import 'package:ai_task_manager/core/database/app_database.dart';
import 'package:ai_task_manager/core/database/daos/project_dao.dart';
import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/network/api_client.dart';
import 'package:ai_task_manager/features/projects/data/projects_api.dart';
import 'package:ai_task_manager/features/projects/model/project_entity.dart';
import 'package:ai_task_manager/features/projects/model/project_model.dart';

class ProjectService {
  final ApiClient _apiClient;
  final ProjectsDao _projectsDao;

  const ProjectService({
    required ApiClient apiClient,
    required ProjectsDao projectsDao,
  })  : _apiClient = apiClient,
        _projectsDao = projectsDao;

  Future<List<ProjectEntity>> getProjects() async {
    try {
      final response = await _apiClient.get<List<dynamic>>(ProjectsApi.list);
      final data = response.data;

      if (data == null) {
        throw const ServerException(message: 'No data received from server');
      }

      final projects = data
          .map((json) => ProjectModel.fromJson(json as Map<String, dynamic>))
          .toList();

      for (final project in projects) {
        await _cacheProject(project);
      }

      return projects;
    } on ServerException {
      return _getCachedProjects();
    } catch (e) {
      try {
        return await _getCachedProjects();
      } catch (_) {
        throw ServerException(message: e.toString(), statusCode: 500);
      }
    }
  }

  Future<ProjectEntity> getProjectById(String id) async {
    try {
      final response =
          await _apiClient.get<Map<String, dynamic>>(ProjectsApi.getById(id));
      final data = response.data;

      if (data == null) {
        throw const ServerException(message: 'No data received from server');
      }

      final project = ProjectModel.fromJson(data);
      await _cacheProject(project);
      return project;
    } on ServerException {
      return _getCachedProjectById(id);
    }
  }

  Future<ProjectEntity> createProject({
    required String name,
    String? description,
    String? color,
  }) async {
    try {
      final body = <String, dynamic>{
        'name': name,
        'description': ?description,
        'color': ?color,
      };

      final response = await _apiClient.post<Map<String, dynamic>>(
        ProjectsApi.create,
        data: body,
      );
      final data = response.data;

      if (data == null) {
        throw const ServerException(message: 'No data received from server');
      }

      final project = ProjectModel.fromJson(data);
      await _cacheProject(project);
      return project;
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString(), statusCode: 500);
    }
  }

  Future<ProjectEntity> updateProject(ProjectEntity project) async {
    try {
      final model = ProjectModel.fromEntity(project);
      final response = await _apiClient.put<Map<String, dynamic>>(
        ProjectsApi.update(project.id),
        data: model.toJson(),
      );
      final data = response.data;

      if (data == null) {
        throw const ServerException(message: 'No data received from server');
      }

      final updated = ProjectModel.fromJson(data);
      await _cacheProject(updated);
      return updated;
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString(), statusCode: 500);
    }
  }

  Future<void> deleteProject(String id) async {
    try {
      await _apiClient.delete<void>(ProjectsApi.delete(id));
      await _projectsDao.deleteProject(id);
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString(), statusCode: 500);
    }
  }

  Stream<List<ProjectEntity>> watchProjects() {
    return _projectsDao.watchAllProjects().map(
          (projects) => projects.map(_mapDriftToModel).toList(),
        );
  }

  Future<void> _cacheProject(ProjectModel project) async {
    try {
      await _projectsDao.insertProject(
        ProjectsCompanion.insert(
          id: project.id,
          name: project.name,
          description: Value(project.description),
          color: Value(project.color),
          ownerId: project.ownerId,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        ),
      );
    } catch (_) {
      try {
        await _projectsDao.updateProject(
          ProjectsCompanion(
            id: Value(project.id),
            name: Value(project.name),
            description: Value(project.description),
            color: Value(project.color),
            ownerId: Value(project.ownerId),
            createdAt: Value(project.createdAt),
            updatedAt: Value(project.updatedAt),
          ),
        );
      } catch (e) {
        throw CacheException(message: 'Failed to cache project: $e');
      }
    }
  }

  Future<List<ProjectModel>> _getCachedProjects() async {
    final projects = await _projectsDao.getAllProjects();
    return projects.map(_mapDriftToModel).toList();
  }

  Future<ProjectModel> _getCachedProjectById(String id) async {
    final project = await _projectsDao.getProjectById(id);
    return _mapDriftToModel(project);
  }

  ProjectModel _mapDriftToModel(Project project) {
    return ProjectModel(
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    );
  }
}
