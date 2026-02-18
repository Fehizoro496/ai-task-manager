/// Auth API endpoints
abstract class AuthApi {
  static const String basePath = '/auth';

  /// POST /auth/login
  /// Body: { email: string, password: string }
  /// Response: { user: User, token: string }
  static const String login = '$basePath/login';

  /// POST /auth/register
  /// Body: { name: string, email: string, password: string }
  /// Response: { user: User, token: string }
  static const String register = '$basePath/register';

  /// GET /auth/me
  /// Headers: Authorization: Bearer <token>
  /// Response: User
  static const String me = '$basePath/me';

  /// GET /auth/google
  /// Response: { url: string, state: string }
  static const String googleInit = '$basePath/google';

  /// GET /auth/google/status/:state
  /// Response: { status: 'pending' | 'success' | 'error' | 'expired', token?, user?, error? }
  static String googleStatus(String state) => '$basePath/google/status/$state';
}
