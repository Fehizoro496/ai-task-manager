/// Projects API endpoints
abstract class ProjectsApi {
  static const String basePath = '/projects';

  /// GET /projects
  /// Response: List<Project>
  static const String list = basePath;

  /// GET /projects/:id
  /// Response: Project
  static String getById(String id) => '$basePath/$id';

  /// POST /projects
  /// Body: { name: string, description?: string, color?: string }
  /// Response: Project
  static const String create = basePath;

  /// PUT /projects/:id
  /// Body: Project
  /// Response: Project
  static String update(String id) => '$basePath/$id';

  /// DELETE /projects/:id
  static String delete(String id) => '$basePath/$id';
}
