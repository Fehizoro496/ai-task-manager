import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/features/auth/model/user_entity.dart';
import 'package:ai_task_manager/features/auth/service/auth_service.dart';
import 'package:ai_task_manager/shared/providers.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final prefs = ref.watch(sharedPreferencesProvider);
  final db = ref.watch(appDatabaseProvider);
  return AuthService(
    apiClient: apiClient,
    prefs: prefs,
    usersDao: db.usersDao,
  );
});

final authStateProvider =
    AsyncNotifierProvider<AuthViewModel, UserEntity?>(AuthViewModel.new);

final currentUserProvider = StreamProvider<UserEntity?>((ref) {
  final service = ref.watch(authServiceProvider);
  return service.watchCurrentUser();
});

class AuthViewModel extends AsyncNotifier<UserEntity?> {
  @override
  Future<UserEntity?> build() async {
    final service = ref.read(authServiceProvider);
    if (!service.isLoggedIn) return null;
    try {
      return await service.getCurrentUser();
    } catch (_) {
      return null;
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    try {
      final user = await ref.read(authServiceProvider).login(email, password);
      state = AsyncData(user);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> register(String name, String email, String password) async {
    state = const AsyncLoading();
    try {
      final user =
          await ref.read(authServiceProvider).register(name, email, password);
      state = AsyncData(user);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> logout() async {
    state = const AsyncLoading();
    try {
      await ref.read(authServiceProvider).logout();
      state = const AsyncData(null);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }
}
