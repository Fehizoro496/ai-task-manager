abstract class AdminApi {
  static const String basePath = '/admin';

  static const String users = '$basePath/users';

  static String approve(String id) => '$basePath/users/$id/approve';
  static String reject(String id) => '$basePath/users/$id/reject';

  static String projectMembers(String projectId) =>
      '$basePath/projects/$projectId/members';

  static String removeProjectMember(String projectId, String userId) =>
      '$basePath/projects/$projectId/members/$userId';
}
