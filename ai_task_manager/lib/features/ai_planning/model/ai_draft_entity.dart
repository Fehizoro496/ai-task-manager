import 'package:equatable/equatable.dart';

enum DraftStatus { pending, generating, generated, approved, rejected }

class AiDraftEntity extends Equatable {
  final String id;
  final String projectId;
  final String inputDocument;
  final AiGeneratedPlan? generatedPlan;
  final DraftStatus status;
  final DateTime createdAt;

  const AiDraftEntity({
    required this.id,
    required this.projectId,
    required this.inputDocument,
    this.generatedPlan,
    this.status = DraftStatus.pending,
    required this.createdAt,
  });

  @override
  List<Object?> get props =>
      [id, projectId, inputDocument, generatedPlan, status, createdAt];
}

class AiGeneratedPlan extends Equatable {
  final List<AiEpicDraft> epics;

  const AiGeneratedPlan({required this.epics});

  int get totalStories =>
      epics.fold(0, (sum, e) => sum + e.stories.length);

  int get totalTasks =>
      epics.fold(0, (sum, e) => e.stories.fold(sum, (s, st) => s + st.tasks.length));

  @override
  List<Object?> get props => [epics];
}

class AiEpicDraft extends Equatable {
  final String title;
  final String? description;
  final List<AiStoryDraft> stories;

  const AiEpicDraft({
    required this.title,
    this.description,
    required this.stories,
  });

  @override
  List<Object?> get props => [title, description, stories];
}

class AiStoryDraft extends Equatable {
  final String title;
  final String? description;
  final List<AiTaskDraft> tasks;

  const AiStoryDraft({
    required this.title,
    this.description,
    required this.tasks,
  });

  @override
  List<Object?> get props => [title, description, tasks];
}

class AiTaskDraft extends Equatable {
  final String title;
  final String? description;
  final String priority;

  const AiTaskDraft({
    required this.title,
    this.description,
    this.priority = 'medium',
  });

  @override
  List<Object?> get props => [title, description, priority];
}
