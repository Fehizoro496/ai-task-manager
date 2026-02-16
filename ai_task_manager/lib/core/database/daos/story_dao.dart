import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables.dart';

part 'story_dao.g.dart';

@DriftAccessor(tables: [Stories])
class StoriesDao extends DatabaseAccessor<AppDatabase> with _$StoriesDaoMixin {
  StoriesDao(super.db);

  Future<List<Story>> getStoriesByEpic(String epicId) =>
      (select(stories)
            ..where((s) => s.epicId.equals(epicId))
            ..orderBy([(s) => OrderingTerm.asc(s.order)]))
          .get();

  Future<List<Story>> getStoriesByProject(String projectId) =>
      (select(stories)
            ..where((s) => s.projectId.equals(projectId))
            ..orderBy([(s) => OrderingTerm.asc(s.order)]))
          .get();

  Future<int> insertStory(StoriesCompanion story) =>
      into(stories).insert(story);

  Future<bool> updateStory(Insertable<Story> story) =>
      update(stories).replace(story);

  Future<int> deleteStory(String id) =>
      (delete(stories)..where((s) => s.id.equals(id))).go();

  Stream<List<Story>> watchStoriesByProject(String projectId) =>
      (select(stories)
            ..where((s) => s.projectId.equals(projectId))
            ..orderBy([(s) => OrderingTerm.asc(s.order)]))
          .watch();
}
