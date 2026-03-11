abstract class AdminApi {
  static const String basePath = '/admin';

  static const String users = '$basePath/users';

  static String approve(String id) => '$basePath/users/$id/approve';
  static String reject(String id) => '$basePath/users/$id/reject';
}
