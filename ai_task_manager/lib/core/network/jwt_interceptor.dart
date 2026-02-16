import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String _kCachedTokenKey = 'cached_auth_token';

class JwtInterceptor extends Interceptor {
  final SharedPreferences _prefs;

  JwtInterceptor({required SharedPreferences prefs}) : _prefs = prefs;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) {
    final token = _prefs.getString(_kCachedTokenKey);
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      // Token expired or invalid — handled by auth viewmodel
    }
    handler.next(err);
  }
}
