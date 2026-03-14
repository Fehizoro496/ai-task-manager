import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/features/admin/viewmodel/admin_viewmodel.dart';
import 'package:ai_task_manager/features/ai_planning/viewmodel/ai_planning_viewmodel.dart';
import 'package:ai_task_manager/features/auth/model/user_entity.dart';
import 'package:ai_task_manager/features/auth/service/auth_service.dart';
import 'package:ai_task_manager/features/notifications/viewmodel/notification_viewmodel.dart';
import 'package:ai_task_manager/features/projects/viewmodel/project_viewmodel.dart';
import 'package:ai_task_manager/shared/app_layout.dart';
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

  void _invalidateUserProviders() {
    ref.invalidate(projectListProvider);
    ref.invalidate(projectStreamProvider);
    ref.invalidate(selectedProjectProvider);
    ref.invalidate(notificationsProvider);
    ref.invalidate(adminUsersProvider);
    ref.invalidate(adminOverviewProvider);
    ref.invalidate(aiPlanningStateProvider);
    ref.invalidate(selectedNavIndexProvider);
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    try {
      final user = await ref.read(authServiceProvider).login(email, password);
      state = AsyncData(user);
      _invalidateUserProviders();
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
    } on PendingApprovalException catch (e) {
      state = AsyncError(e, StackTrace.current);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> loginWithGoogle() async {
    state = const AsyncLoading();
    try {
      final user = await ref.read(authServiceProvider).loginWithGoogle();
      state = AsyncData(user);
      _invalidateUserProviders();
    } on PendingApprovalException catch (e) {
      state = AsyncError(e, StackTrace.current);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  void clearError() {
    state = const AsyncData(null);
  }

  Future<void> logout() async {
    state = const AsyncLoading();
    try {
      await ref.read(authServiceProvider).logout();
      state = const AsyncData(null);
      _invalidateUserProviders();
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }
}
