import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables.dart';

part 'task_dao.g.dart';

@DriftAccessor(tables: [Tasks])
class TasksDao extends DatabaseAccessor<AppDatabase> with _$TasksDaoMixin {
  TasksDao(super.db);

  Future<List<Task>> getTasksByProject(String projectId) =>
      (select(tasks)
            ..where((t) => t.projectId.equals(projectId))
            ..orderBy([(t) => OrderingTerm.asc(t.order)]))
          .get();

  Future<List<Task>> getTasksByStatus(String projectId, String status) =>
      (select(tasks)
            ..where(
                (t) => t.projectId.equals(projectId) & t.status.equals(status))
            ..orderBy([(t) => OrderingTerm.asc(t.order)]))
          .get();

  Future<int> insertTask(TasksCompanion task) => into(tasks).insert(task);

  Future<bool> updateTask(Insertable<Task> task) =>
      update(tasks).replace(task);

  Future<int> deleteTask(String id) =>
      (delete(tasks)..where((t) => t.id.equals(id))).go();

  Future<int> updateTaskStatus(String id, String status) =>
      (update(tasks)..where((t) => t.id.equals(id))).write(
        TasksCompanion(
          status: Value(status),
          updatedAt: Value(DateTime.now()),
        ),
      );

  Stream<List<Task>> watchTasksByProject(String projectId) =>
      (select(tasks)
            ..where((t) => t.projectId.equals(projectId))
            ..orderBy([(t) => OrderingTerm.asc(t.order)]))
          .watch();

  Stream<List<Task>> watchTasksByProjectAndStatus(
    String projectId,
    String status,
  ) =>
      (select(tasks)
            ..where(
                (t) => t.projectId.equals(projectId) & t.status.equals(status))
            ..orderBy([(t) => OrderingTerm.asc(t.order)]))
          .watch();

  Future<void> reorderTask(String id, int newOrder) =>
      (update(tasks)..where((t) => t.id.equals(id))).write(
        TasksCompanion(
          order: Value(newOrder),
          updatedAt: Value(DateTime.now()),
        ),
      );
}
