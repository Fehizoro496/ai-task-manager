import 'package:drift/drift.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:ai_task_manager/core/database/app_database.dart';
import 'package:ai_task_manager/core/database/daos/user_dao.dart';
import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/core/network/api_client.dart';
import 'package:ai_task_manager/features/auth/data/auth_api.dart';
import 'package:ai_task_manager/features/auth/model/auth_response_model.dart';
import 'package:ai_task_manager/features/auth/model/user_entity.dart';
import 'package:ai_task_manager/features/auth/model/user_model.dart';

const String _kCachedTokenKey = 'cached_auth_token';
const String _kCachedUserIdKey = 'cached_user_id';

class AuthService {
  final ApiClient _apiClient;
  final SharedPreferences _prefs;
  final UsersDao _usersDao;

  const AuthService({
    required ApiClient apiClient,
    required SharedPreferences prefs,
    required UsersDao usersDao,
  })  : _apiClient = apiClient,
        _prefs = prefs,
        _usersDao = usersDao;

  String? get cachedToken => _prefs.getString(_kCachedTokenKey);

  Future<UserEntity> login(String email, String password) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        AuthApi.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }

      final authResponse = AuthResponseModel.fromJson(response.data!);
      final user = authResponse.userWithToken;

      await _cacheUser(user);
      _apiClient.updateToken(user.token);
      return user;
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<UserEntity> register(
    String name,
    String email,
    String password,
  ) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        AuthApi.register,
        data: {
          'name': name,
          'email': email,
          'password': password,
        },
      );

      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }

      final authResponse = AuthResponseModel.fromJson(response.data!);
      final user = authResponse.userWithToken;

      await _cacheUser(user);
      _apiClient.updateToken(user.token);
      return user;
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  Future<void> logout() async {
    final userId = _prefs.getString(_kCachedUserIdKey);
    await _prefs.remove(_kCachedTokenKey);
    await _prefs.remove(_kCachedUserIdKey);
    _apiClient.updateToken(null);

    if (userId != null) {
      try {
        await _usersDao.deleteUser(userId);
      } catch (_) {}
    }
  }

  Future<UserEntity> getCurrentUser() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(AuthApi.me);
      if (response.data == null) {
        throw const ServerException(message: 'No data received from server');
      }
      final user = UserModel.fromJson(response.data!);
      await _cacheUser(user.copyWith(token: cachedToken));
      return user;
    } on AuthException {
      rethrow;
    } catch (_) {
      return _getCachedUser();
    }
  }

  Stream<UserEntity?> watchCurrentUser() {
    final userId = _prefs.getString(_kCachedUserIdKey);
    if (userId == null) {
      return Stream.value(null);
    }

    return _usersDao.watchCurrentUser(userId).map(
          (user) => UserModel(
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            token: user.token,
          ),
        );
  }

  bool get isLoggedIn => _prefs.getString(_kCachedTokenKey) != null;

  Future<void> _cacheUser(UserModel user) async {
    if (user.token != null) {
      await _prefs.setString(_kCachedTokenKey, user.token!);
    }
    await _prefs.setString(_kCachedUserIdKey, user.id);

    try {
      await _usersDao.insertUser(
        UsersCompanion(
          id: Value(user.id),
          email: Value(user.email),
          name: Value(user.name),
          avatarUrl: Value(user.avatarUrl),
          token: Value(user.token),
          createdAt: Value(DateTime.now()),
        ),
      );
    } catch (_) {
      try {
        await _usersDao.updateUser(
          UsersCompanion(
            id: Value(user.id),
            email: Value(user.email),
            name: Value(user.name),
            avatarUrl: Value(user.avatarUrl),
            token: Value(user.token),
            createdAt: Value(DateTime.now()),
          ),
        );
      } catch (e) {
        throw CacheException(message: 'Failed to cache user: $e');
      }
    }
  }

  Future<UserEntity> _getCachedUser() async {
    final userId = _prefs.getString(_kCachedUserIdKey);
    if (userId == null) {
      throw const AuthException(message: 'No cached user found');
    }

    final user = await _usersDao.getUserById(userId);
    return UserModel(
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      token: user.token,
    );
  }
}
