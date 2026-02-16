import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables.dart';

part 'ai_draft_dao.g.dart';

@DriftAccessor(tables: [AiDrafts])
class AiDraftsDao extends DatabaseAccessor<AppDatabase>
    with _$AiDraftsDaoMixin {
  AiDraftsDao(super.db);

  Future<List<AiDraft>> getDraftsByProject(String projectId) =>
      (select(aiDrafts)
            ..where((d) => d.projectId.equals(projectId))
            ..orderBy([(d) => OrderingTerm.desc(d.createdAt)]))
          .get();

  Future<int> insertDraft(AiDraftsCompanion draft) =>
      into(aiDrafts).insert(draft);

  Future<bool> updateDraft(Insertable<AiDraft> draft) =>
      update(aiDrafts).replace(draft);

  Future<int> deleteDraft(String id) =>
      (delete(aiDrafts)..where((d) => d.id.equals(id))).go();

  Stream<List<AiDraft>> watchDraftsByProject(String projectId) =>
      (select(aiDrafts)
            ..where((d) => d.projectId.equals(projectId))
            ..orderBy([(d) => OrderingTerm.desc(d.createdAt)]))
          .watch();
}
