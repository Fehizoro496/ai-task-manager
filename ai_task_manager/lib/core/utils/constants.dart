class AppConstants {
  AppConstants._();

  static const String appName = 'AI Task Manager';
  static const String appVersion = '1.0.0';

  static const Duration animationDuration = Duration(milliseconds: 200);
  static const Duration animationDurationSlow = Duration(milliseconds: 400);

  static const double sidebarWidth = 240.0;
  static const double sidebarCollapsedWidth = 68.0;
  static const double kanbanColumnWidth = 320.0;
  static const double taskCardMinHeight = 80.0;

  static const int apiTimeout = 30000;
  static const int maxRetries = 3;
}
