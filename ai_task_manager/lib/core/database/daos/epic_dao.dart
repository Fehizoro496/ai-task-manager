import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables.dart';

part 'epic_dao.g.dart';

@DriftAccessor(tables: [Epics])
class EpicsDao extends DatabaseAccessor<AppDatabase> with _$EpicsDaoMixin {
  EpicsDao(super.db);

  Future<List<Epic>> getEpicsByProject(String projectId) =>
      (select(epics)
            ..where((e) => e.projectId.equals(projectId))
            ..orderBy([(e) => OrderingTerm.asc(e.order)]))
          .get();

  Future<int> insertEpic(EpicsCompanion epic) => into(epics).insert(epic);

  Future<bool> updateEpic(Insertable<Epic> epic) =>
      update(epics).replace(epic);

  Future<int> deleteEpic(String id) =>
      (delete(epics)..where((e) => e.id.equals(id))).go();

  Stream<List<Epic>> watchEpicsByProject(String projectId) =>
      (select(epics)
            ..where((e) => e.projectId.equals(projectId))
            ..orderBy([(e) => OrderingTerm.asc(e.order)]))
          .watch();
}
