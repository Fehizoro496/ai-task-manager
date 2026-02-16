import 'dart:async';

import 'package:dio/dio.dart';

import 'package:ai_task_manager/core/errors/exceptions.dart';
import 'package:ai_task_manager/features/ai_planning/model/ai_draft_entity.dart';
import 'package:ai_task_manager/features/ai_planning/model/ai_draft_model.dart';

class AiPlanningService {
  final Dio _dio;
  final _store = <String, AiDraftModel>{};
  final _changeController = StreamController<void>.broadcast();

  AiPlanningService({required Dio dio}) : _dio = dio;

  /// Sends the [document] to the AI backend and returns a generated draft.
  Future<AiDraftEntity> generatePlan(
    String projectId,
    String document,
  ) async {
    try {
      final response = await _dio.post(
        '/ai/generate-plan',
        data: {
          'project_id': projectId,
          'document': document,
        },
      );
      final draft =
          AiDraftModel.fromJson(response.data as Map<String, dynamic>);
      _cacheDraft(draft);
      return draft;
    } on DioException catch (e) {
      throw ServerException(
        message: _extractErrorMessage(e),
        statusCode: e.response?.statusCode,
      );
    }
  }

  /// Approves a draft, promoting it to actual project items.
  Future<void> approveDraft(String draftId) async {
    try {
      await _dio.post('/ai/drafts/$draftId/approve');
      _removeDraft(draftId);
    } on DioException catch (e) {
      throw ServerException(
        message: _extractErrorMessage(e),
        statusCode: e.response?.statusCode,
      );
    }
  }

  /// Rejects a draft, marking it as discarded.
  Future<void> rejectDraft(String draftId) async {
    try {
      await _dio.post('/ai/drafts/$draftId/reject');
      _removeDraft(draftId);
    } on DioException catch (e) {
      throw ServerException(
        message: _extractErrorMessage(e),
        statusCode: e.response?.statusCode,
      );
    }
  }

  /// Fetches all drafts associated with a given [projectId].
  Future<List<AiDraftEntity>> getDraftsByProject(String projectId) async {
    try {
      final response = await _dio.get(
        '/ai/drafts',
        queryParameters: {'project_id': projectId},
      );
      final data = response.data as List<dynamic>;
      final drafts = data
          .map((item) => AiDraftModel.fromJson(item as Map<String, dynamic>))
          .toList();
      for (final draft in drafts) {
        _cacheDraft(draft);
      }
      return drafts;
    } on DioException catch (e) {
      // Fall back to local cache on server failure.
      final cached = _getCachedDraftsByProject(projectId);
      if (cached.isNotEmpty) return cached;
      throw ServerException(
        message: _extractErrorMessage(e),
        statusCode: e.response?.statusCode,
      );
    }
  }

  /// Returns a reactive stream of drafts for a given [projectId].
  Stream<List<AiDraftEntity>> watchDraftsByProject(String projectId) async* {
    yield _getCachedDraftsByProject(projectId);
    await for (final _ in _changeController.stream) {
      yield _getCachedDraftsByProject(projectId);
    }
  }

  void _cacheDraft(AiDraftModel draft) {
    _store[draft.id] = draft;
    _changeController.add(null);
  }

  void _removeDraft(String draftId) {
    _store.remove(draftId);
    _changeController.add(null);
  }

  List<AiDraftModel> _getCachedDraftsByProject(String projectId) {
    return _store.values
        .where((d) => d.projectId == projectId)
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  String _extractErrorMessage(DioException e) {
    final responseData = e.response?.data;
    if (responseData is Map<String, dynamic>) {
      return (responseData['message'] as String?) ??
          (responseData['error'] as String?) ??
          e.message ??
          'An unexpected server error occurred';
    }
    return e.message ?? 'An unexpected server error occurred';
  }

  void dispose() {
    _changeController.close();
  }
}
