import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/features/projects/model/project_entity.dart';
import 'package:ai_task_manager/features/projects/service/project_service.dart';
import 'package:ai_task_manager/shared/providers.dart';

// ---------------------------------------------------------------------------
// Infrastructure providers
// ---------------------------------------------------------------------------

final projectServiceProvider = Provider<ProjectService>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return ProjectService(
    apiClient: ref.watch(apiClientProvider),
    projectsDao: db.projectsDao,
  );
});

// ---------------------------------------------------------------------------
// Selected project
// ---------------------------------------------------------------------------

final selectedProjectProvider = StateProvider<ProjectEntity?>((ref) => null);

// ---------------------------------------------------------------------------
// Stream provider - watches local cache for reactive updates
// ---------------------------------------------------------------------------

final projectStreamProvider = StreamProvider<List<ProjectEntity>>((ref) {
  final service = ref.watch(projectServiceProvider);
  return service.watchProjects();
});

// ---------------------------------------------------------------------------
// Async notifier - primary project list state
// ---------------------------------------------------------------------------

final projectListProvider =
    AsyncNotifierProvider<ProjectListViewModel, List<ProjectEntity>>(
  ProjectListViewModel.new,
);

class ProjectListViewModel extends AsyncNotifier<List<ProjectEntity>> {
  late ProjectService _service;

  @override
  Future<List<ProjectEntity>> build() async {
    final prefs = ref.read(sharedPreferencesProvider);
    if (prefs.getString(kCachedAuthTokenKey) == null) return [];
    _service = ref.watch(projectServiceProvider);
    return _loadProjects();
  }

  Future<List<ProjectEntity>> _loadProjects() async {
    return await _service.getProjects();
  }

  Future<void> loadProjects() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_loadProjects);
  }

  Future<void> createProject({
    required String name,
    String? description,
    String? color,
  }) async {
    final project = await _service.createProject(
      name: name,
      description: description,
      color: color,
    );

    final current = state.valueOrNull ?? [];
    state = AsyncData([...current, project]);
  }

  Future<void> deleteProject(String id) async {
    await _service.deleteProject(id);

    final current = state.valueOrNull ?? [];
    state = AsyncData(current.where((p) => p.id != id).toList());

    final selected = ref.read(selectedProjectProvider);
    if (selected?.id == id) {
      ref.read(selectedProjectProvider.notifier).state = null;
    }
  }
}
