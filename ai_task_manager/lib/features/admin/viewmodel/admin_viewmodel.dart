import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/features/admin/model/admin_user_model.dart';
import 'package:ai_task_manager/features/admin/model/project_member_model.dart';
import 'package:ai_task_manager/features/admin/service/admin_service.dart';
import 'package:ai_task_manager/features/projects/model/project_entity.dart';
import 'package:ai_task_manager/features/projects/viewmodel/project_viewmodel.dart';
import 'package:ai_task_manager/features/tasks/model/task_entity.dart';
import 'package:ai_task_manager/features/tasks/viewmodel/task_viewmodel.dart';
import 'package:ai_task_manager/shared/providers.dart';

final adminServiceProvider = Provider<AdminService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AdminService(apiClient: apiClient);
});

/// Approved users available for task assignment (admin use only).
final approvedUsersProvider = FutureProvider<List<AdminUserModel>>((ref) {
  return ref.read(adminServiceProvider).getUsers(status: 'APPROVED');
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

class AdminOverviewData {
  final List<ProjectEntity> projects;
  final Map<String, List<TaskEntity>> tasksByProject;
  final List<AdminUserModel> approvedUsers;

  const AdminOverviewData({
    required this.projects,
    required this.tasksByProject,
    required this.approvedUsers,
  });

  int get totalProjects => projects.length;
  int get totalTasks =>
      tasksByProject.values.fold(0, (sum, list) => sum + list.length);
  int get totalMembers => approvedUsers.length;
}

final adminOverviewProvider = FutureProvider<AdminOverviewData>((ref) async {
  final projects = await ref.watch(projectListProvider.future);
  final approvedUsers = await ref.watch(approvedUsersProvider.future);

  final taskEntries = await Future.wait(
    projects.map((p) async {
      final tasks = await ref.read(boardTasksProvider(p.id).future);
      return MapEntry(p.id, tasks);
    }),
  );

  return AdminOverviewData(
    projects: projects,
    tasksByProject: Map.fromEntries(taskEntries),
    approvedUsers: approvedUsers,
  );
});

// ---------------------------------------------------------------------------
// Project members
// ---------------------------------------------------------------------------

final projectMembersProvider = AsyncNotifierProvider.family<
    ProjectMembersViewModel, List<ProjectMemberModel>, String>(
  ProjectMembersViewModel.new,
);

class ProjectMembersViewModel
    extends FamilyAsyncNotifier<List<ProjectMemberModel>, String> {
  @override
  Future<List<ProjectMemberModel>> build(String arg) async {
    return ref.read(adminServiceProvider).getProjectMembers(arg);
  }

  Future<void> addMember(String userId) async {
    final member =
        await ref.read(adminServiceProvider).addProjectMember(arg, userId);
    final current = state.valueOrNull ?? [];
    state = AsyncData([...current, member]);
  }

  Future<void> removeMember(String userId) async {
    await ref.read(adminServiceProvider).removeProjectMember(arg, userId);
    final current = state.valueOrNull ?? [];
    state = AsyncData(current.where((m) => m.userId != userId).toList());
  }
}
