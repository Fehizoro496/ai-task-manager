import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ai_task_manager/features/notifications/model/notification_entity.dart';
import 'package:ai_task_manager/features/notifications/service/notification_service.dart';
import 'package:ai_task_manager/shared/providers.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return NotificationService(apiClient: apiClient);
});

final notificationsProvider =
    AsyncNotifierProvider<NotificationsViewModel, List<NotificationEntity>>(
        NotificationsViewModel.new);

class NotificationsViewModel
    extends AsyncNotifier<List<NotificationEntity>> {
  @override
  Future<List<NotificationEntity>> build() async {
    final prefs = ref.read(sharedPreferencesProvider);
    if (prefs.getString(kCachedAuthTokenKey) == null) return [];
    return ref.read(notificationServiceProvider).getNotifications();
  }

  Future<void> markAsRead(String id) async {
    final current = state.valueOrNull ?? [];
    state = AsyncData(
      current.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList(),
    );
    try {
      await ref.read(notificationServiceProvider).markAsRead(id);
    } catch (_) {
      state = AsyncData(current);
    }
  }

  Future<void> markAllAsRead() async {
    final current = state.valueOrNull ?? [];
    state = AsyncData(
      current.map((n) => n.copyWith(isRead: true)).toList(),
    );
    try {
      await ref.read(notificationServiceProvider).markAllAsRead();
    } catch (_) {
      state = AsyncData(current);
    }
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
    await future;
  }
}

final unreadCountProvider = Provider<int>((ref) {
  final notifications = ref.watch(notificationsProvider);
  return notifications.maybeWhen(
    data: (list) => list.where((n) => !n.isRead).length,
    orElse: () => 0,
  );
});
