class ApiConfig {
  ApiConfig._();

  /// Par défaut, l'hôte de la machine vu depuis l'émulateur Android.
  /// Sur un appareil physique : `--dart-define=API_BASE_URL=http://<IP LAN>:3000/api`.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api',
  );

  static const int connectTimeout = 15000;
  static const int receiveTimeout = 30000;
  static const int sendTimeout = 15000;
}
