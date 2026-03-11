import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'daos/ai_draft_dao.dart';
import 'daos/epic_dao.dart';
import 'daos/project_dao.dart';
import 'daos/story_dao.dart';
import 'daos/task_dao.dart';
import 'daos/user_dao.dart';
import 'tables.dart';

part 'app_database.g.dart';

@DriftDatabase(
  tables: [
    Users,
    Projects,
    Epics,
    Stories,
    Tasks,
    AiDrafts,
  ],
  daos: [
    UsersDao,
    ProjectsDao,
    EpicsDao,
    StoriesDao,
    TasksDao,
    AiDraftsDao,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  AppDatabase.forTesting(super.e);

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator m) async {
        await m.createAll();
      },
      onUpgrade: (Migrator m, int from, int to) async {
        if (from < 2) {
          await m.addColumn(users, users.role);
          await m.addColumn(users, users.status);
        }
      },
    );
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'ai_task_manager.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
