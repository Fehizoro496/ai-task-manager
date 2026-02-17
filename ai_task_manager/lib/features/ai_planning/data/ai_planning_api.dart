/// AI Planning API endpoints
abstract class AiPlanningApi {
  static const String basePath = '/ai';

  /// POST /ai/generate-plan
  /// Body: { project_id: string, document: string }
  /// Response: AiDraft
  static const String generatePlan = '$basePath/generate-plan';

  /// GET /ai/drafts?project_id=:projectId
  /// Response: List of AiDraft
  static const String drafts = '$basePath/drafts';

  /// POST /ai/drafts/:id/approve
  static String approveDraft(String id) => '$basePath/drafts/$id/approve';

  /// POST /ai/drafts/:id/reject
  static String rejectDraft(String id) => '$basePath/drafts/$id/reject';
}
