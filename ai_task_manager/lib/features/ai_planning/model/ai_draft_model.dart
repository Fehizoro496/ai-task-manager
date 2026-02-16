import 'package:ai_task_manager/features/ai_planning/model/ai_draft_entity.dart';

class AiDraftModel extends AiDraftEntity {
  const AiDraftModel({
    required super.id,
    required super.projectId,
    required super.inputDocument,
    super.generatedPlan,
    super.status,
    required super.createdAt,
  });

  factory AiDraftModel.fromJson(Map<String, dynamic> json) {
    return AiDraftModel(
      id: json['id'] as String,
      projectId: json['project_id'] as String,
      inputDocument: json['input_document'] as String,
      generatedPlan: json['generated_plan'] != null
          ? AiGeneratedPlanModel.fromJson(
              json['generated_plan'] as Map<String, dynamic>,
            )
          : null,
      status: _parseDraftStatus(json['status'] as String?),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'project_id': projectId,
      'input_document': inputDocument,
      'generated_plan': generatedPlan != null
          ? AiGeneratedPlanModel.fromEntity(generatedPlan!).toJson()
          : null,
      'status': status.name,
      'created_at': createdAt.toIso8601String(),
    };
  }

  factory AiDraftModel.fromEntity(AiDraftEntity entity) {
    return AiDraftModel(
      id: entity.id,
      projectId: entity.projectId,
      inputDocument: entity.inputDocument,
      generatedPlan: entity.generatedPlan,
      status: entity.status,
      createdAt: entity.createdAt,
    );
  }

  static DraftStatus _parseDraftStatus(String? value) {
    if (value == null) return DraftStatus.pending;
    return DraftStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => DraftStatus.pending,
    );
  }
}

class AiGeneratedPlanModel extends AiGeneratedPlan {
  const AiGeneratedPlanModel({required super.epics});

  factory AiGeneratedPlanModel.fromJson(Map<String, dynamic> json) {
    final epicsList = (json['epics'] as List<dynamic>?) ?? [];
    return AiGeneratedPlanModel(
      epics: epicsList
          .map((e) => AiEpicDraftModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'epics': epics
          .map((e) => AiEpicDraftModel.fromEntity(e).toJson())
          .toList(),
    };
  }

  factory AiGeneratedPlanModel.fromEntity(AiGeneratedPlan entity) {
    return AiGeneratedPlanModel(epics: entity.epics);
  }
}

class AiEpicDraftModel extends AiEpicDraft {
  const AiEpicDraftModel({
    required super.title,
    super.description,
    required super.stories,
  });

  factory AiEpicDraftModel.fromJson(Map<String, dynamic> json) {
    final storiesList = (json['stories'] as List<dynamic>?) ?? [];
    return AiEpicDraftModel(
      title: json['title'] as String,
      description: json['description'] as String?,
      stories: storiesList
          .map((s) => AiStoryDraftModel.fromJson(s as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'stories': stories
          .map((s) => AiStoryDraftModel.fromEntity(s).toJson())
          .toList(),
    };
  }

  factory AiEpicDraftModel.fromEntity(AiEpicDraft entity) {
    return AiEpicDraftModel(
      title: entity.title,
      description: entity.description,
      stories: entity.stories,
    );
  }
}

class AiStoryDraftModel extends AiStoryDraft {
  const AiStoryDraftModel({
    required super.title,
    super.description,
    required super.tasks,
  });

  factory AiStoryDraftModel.fromJson(Map<String, dynamic> json) {
    final tasksList = (json['tasks'] as List<dynamic>?) ?? [];
    return AiStoryDraftModel(
      title: json['title'] as String,
      description: json['description'] as String?,
      tasks: tasksList
          .map((t) => AiTaskDraftModel.fromJson(t as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'tasks': tasks
          .map((t) => AiTaskDraftModel.fromEntity(t).toJson())
          .toList(),
    };
  }

  factory AiStoryDraftModel.fromEntity(AiStoryDraft entity) {
    return AiStoryDraftModel(
      title: entity.title,
      description: entity.description,
      tasks: entity.tasks,
    );
  }
}

class AiTaskDraftModel extends AiTaskDraft {
  const AiTaskDraftModel({
    required super.title,
    super.description,
    super.priority,
  });

  factory AiTaskDraftModel.fromJson(Map<String, dynamic> json) {
    return AiTaskDraftModel(
      title: json['title'] as String,
      description: json['description'] as String?,
      priority: (json['priority'] as String?) ?? 'medium',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'priority': priority,
    };
  }

  factory AiTaskDraftModel.fromEntity(AiTaskDraft entity) {
    return AiTaskDraftModel(
      title: entity.title,
      description: entity.description,
      priority: entity.priority,
    );
  }
}
