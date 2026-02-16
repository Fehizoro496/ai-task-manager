import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/features/ai_planning/model/ai_draft_entity.dart';
import 'package:ai_task_manager/features/ai_planning/service/ai_planning_service.dart';

// ---------------------------------------------------------------------------
// Service provider
// ---------------------------------------------------------------------------

final aiPlanningServiceProvider = Provider<AiPlanningService>((ref) {
  final service = AiPlanningService(
    dio: Dio(BaseOptions(
      baseUrl: 'https://api.example.com/v1',
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 60),
    )),
  );
  ref.onDispose(service.dispose);
  return service;
});

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class AiPlanningState {
  final AiDraftEntity? currentDraft;
  final bool isGenerating;
  final bool isApproving;
  final String? errorMessage;
  final bool approved;

  const AiPlanningState({
    this.currentDraft,
    this.isGenerating = false,
    this.isApproving = false,
    this.errorMessage,
    this.approved = false,
  });

  AiPlanningState copyWith({
    AiDraftEntity? currentDraft,
    bool? isGenerating,
    bool? isApproving,
    String? errorMessage,
    bool? approved,
    bool clearDraft = false,
    bool clearError = false,
  }) {
    return AiPlanningState(
      currentDraft: clearDraft ? null : (currentDraft ?? this.currentDraft),
      isGenerating: isGenerating ?? this.isGenerating,
      isApproving: isApproving ?? this.isApproving,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      approved: approved ?? this.approved,
    );
  }
}

// ---------------------------------------------------------------------------
// ViewModel
// ---------------------------------------------------------------------------

final aiPlanningStateProvider =
    AsyncNotifierProvider<AiPlanningViewModel, AiPlanningState>(
  AiPlanningViewModel.new,
);

class AiPlanningViewModel extends AsyncNotifier<AiPlanningState> {
  late final AiPlanningService _service;

  @override
  Future<AiPlanningState> build() async {
    _service = ref.watch(aiPlanningServiceProvider);
    return const AiPlanningState();
  }

  Future<void> generatePlan(String projectId, String document) async {
    state = AsyncData(
      (state.valueOrNull ?? const AiPlanningState()).copyWith(
        isGenerating: true,
        clearError: true,
        clearDraft: true,
        approved: false,
      ),
    );

    try {
      final draft = await _service.generatePlan(projectId, document);
      state = AsyncData(
        (state.valueOrNull ?? const AiPlanningState()).copyWith(
          isGenerating: false,
          currentDraft: draft,
        ),
      );
    } catch (e) {
      state = AsyncData(
        (state.valueOrNull ?? const AiPlanningState()).copyWith(
          isGenerating: false,
          errorMessage: e.toString(),
        ),
      );
    }
  }

  Future<void> approveDraft() async {
    final current = state.valueOrNull;
    final draftId = current?.currentDraft?.id;
    if (draftId == null) return;

    state = AsyncData(
      current!.copyWith(isApproving: true, clearError: true),
    );

    try {
      await _service.approveDraft(draftId);
      state = AsyncData(
        (state.valueOrNull ?? const AiPlanningState()).copyWith(
          isApproving: false,
          approved: true,
        ),
      );
    } catch (e) {
      state = AsyncData(
        (state.valueOrNull ?? const AiPlanningState()).copyWith(
          isApproving: false,
          errorMessage: e.toString(),
        ),
      );
    }
  }

  Future<void> rejectDraft() async {
    final current = state.valueOrNull;
    final draftId = current?.currentDraft?.id;
    if (draftId == null) return;

    state = AsyncData(
      current!.copyWith(isGenerating: true, clearError: true),
    );

    try {
      await _service.rejectDraft(draftId);
      state = const AsyncData(AiPlanningState());
    } catch (e) {
      state = AsyncData(
        (state.valueOrNull ?? const AiPlanningState()).copyWith(
          isGenerating: false,
          errorMessage: e.toString(),
        ),
      );
    }
  }

  void clearError() {
    final current = state.valueOrNull;
    if (current != null) {
      state = AsyncData(current.copyWith(clearError: true));
    }
  }
}
