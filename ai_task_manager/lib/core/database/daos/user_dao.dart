import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables.dart';

part 'user_dao.g.dart';

@DriftAccessor(tables: [Users])
class UsersDao extends DatabaseAccessor<AppDatabase> with _$UsersDaoMixin {
  UsersDao(super.db);

  Future<List<User>> getAllUsers() => select(users).get();

  Future<User> getUserById(String id) =>
      (select(users)..where((u) => u.id.equals(id))).getSingle();

  Future<int> insertUser(UsersCompanion user) => into(users).insert(user);

  Future<bool> updateUser(Insertable<User> user) =>
      update(users).replace(user);

  Future<int> deleteUser(String id) =>
      (delete(users)..where((u) => u.id.equals(id))).go();

  Stream<User> watchCurrentUser(String id) =>
      (select(users)..where((u) => u.id.equals(id))).watchSingle();
}
