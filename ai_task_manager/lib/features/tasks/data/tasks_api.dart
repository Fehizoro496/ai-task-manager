/// Tasks API endpoints
abstract class TasksApi {
  static const String basePath = '/tasks';

  /// GET /projects/:projectId/tasks
  /// Response: { tasks: List of Task }
  static String listByProject(String projectId) => '/projects/$projectId/tasks';

  /// POST /projects/:projectId/tasks
  /// Body: { title: string, description?: string, priority: string, story_id?: string }
  /// Response: Task
  static String create(String projectId) => '/projects/$projectId/tasks';

  /// PUT /tasks/:id
  /// Body: Task
  /// Response: Task
  static String update(String id) => '$basePath/$id';

  /// DELETE /tasks/:id
  static String delete(String id) => '$basePath/$id';

  /// PATCH /tasks/:id/move
  /// Body: { status: string, order: int }
  static String move(String id) => '$basePath/$id/move';

  /// PATCH /tasks/:id/assign
  static String assign(String id) => '$basePath/$id/assign';
}
