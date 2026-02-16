class ApiConfig {
  ApiConfig._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api',
  );

  static const int connectTimeout = 15000;
  static const int receiveTimeout = 30000;
  static const int sendTimeout = 15000;
}
