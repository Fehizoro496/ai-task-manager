import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables.dart';

part 'project_dao.g.dart';

@DriftAccessor(tables: [Projects])
class ProjectsDao extends DatabaseAccessor<AppDatabase>
    with _$ProjectsDaoMixin {
  ProjectsDao(super.db);

  Future<List<Project>> getAllProjects() => select(projects).get();

  Future<Project> getProjectById(String id) =>
      (select(projects)..where((p) => p.id.equals(id))).getSingle();

  Future<int> insertProject(ProjectsCompanion project) =>
      into(projects).insert(project);

  Future<bool> updateProject(Insertable<Project> project) =>
      update(projects).replace(project);

  Future<int> deleteProject(String id) =>
      (delete(projects)..where((p) => p.id.equals(id))).go();

  Stream<List<Project>> watchAllProjects() => select(projects).watch();

  Stream<Project> watchProjectById(String id) =>
      (select(projects)..where((p) => p.id.equals(id))).watchSingle();
}
