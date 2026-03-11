import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/features/admin/model/admin_user_model.dart';
import 'package:ai_task_manager/features/admin/service/admin_service.dart';
import 'package:ai_task_manager/shared/providers.dart';

final adminServiceProvider = Provider<AdminService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AdminService(apiClient: apiClient);
});

/// Filter: null = all, 'PENDING', 'APPROVED', 'REJECTED'
final adminUserFilterProvider = StateProvider<String?>((ref) => 'PENDING');

final adminUsersProvider =
    AsyncNotifierProvider<AdminUsersViewModel, List<AdminUserModel>>(
        AdminUsersViewModel.new);

class AdminUsersViewModel extends AsyncNotifier<List<AdminUserModel>> {
  @override
  Future<List<AdminUserModel>> build() async {
    final filter = ref.watch(adminUserFilterProvider);
    return ref.read(adminServiceProvider).getUsers(status: filter);
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
  }

  Future<void> approveUser(String id) async {
    await ref.read(adminServiceProvider).approveUser(id);
    ref.invalidateSelf();
  }

  Future<void> rejectUser(String id) async {
    await ref.read(adminServiceProvider).rejectUser(id);
    ref.invalidateSelf();
  }
}
