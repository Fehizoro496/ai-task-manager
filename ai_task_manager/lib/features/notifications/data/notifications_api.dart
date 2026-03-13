abstract class NotificationsApi {
  static const String basePath = '/notifications';

  static const String list = basePath;

  static String markRead(String id) => '$basePath/$id/read';

  static const String markAllRead = '$basePath/read-all';
}
