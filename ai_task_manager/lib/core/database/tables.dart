import 'package:drift/drift.dart';

class Users extends Table {
  TextColumn get id => text()();
  TextColumn get email => text()();
  TextColumn get name => text()();
  TextColumn get avatarUrl => text().nullable()();
  TextColumn get token => text().nullable()();
  TextColumn get role =>
      text().nullable().withDefault(const Constant('USER'))();
  TextColumn get status =>
      text().nullable().withDefault(const Constant('PENDING'))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class Projects extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get description => text().nullable()();
  TextColumn get color => text().nullable()();
  TextColumn get ownerId => text().references(Users, #id)();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class Epics extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get description => text().nullable()();
  TextColumn get projectId => text().references(Projects, #id)();
  IntColumn get order => integer()();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class Stories extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get description => text().nullable()();
  TextColumn get epicId => text().references(Epics, #id)();
  TextColumn get projectId => text().references(Projects, #id)();
  IntColumn get order => integer()();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class Tasks extends Table {
  TextColumn get id => text()();
  TextColumn get identifier => text().nullable()();
  TextColumn get githubBranch => text().nullable()();
  TextColumn get title => text()();
  TextColumn get description => text().nullable()();
  TextColumn get status => text().withDefault(const Constant('todo'))();
  TextColumn get priority => text().withDefault(const Constant('medium'))();
  TextColumn get storyId => text().nullable().references(Stories, #id)();
  TextColumn get projectId => text().references(Projects, #id)();
  TextColumn get assigneeId => text().nullable().references(Users, #id)();
  TextColumn get labels => text().nullable()();
  IntColumn get order => integer()();
  DateTimeColumn get dueDate => dateTime().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class AiDrafts extends Table {
  TextColumn get id => text()();
  TextColumn get projectId => text().references(Projects, #id)();
  TextColumn get inputDocument => text()();
  TextColumn get generatedPlan => text()();
  TextColumn get status => text().withDefault(const Constant('pending'))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}
