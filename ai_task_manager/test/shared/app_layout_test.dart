import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:ai_task_manager/features/admin/viewmodel/admin_viewmodel.dart';
import 'package:ai_task_manager/features/auth/model/user_entity.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';
import 'package:ai_task_manager/features/messages/viewmodel/chat_viewmodel.dart';
import 'package:ai_task_manager/features/notifications/viewmodel/notification_viewmodel.dart';
import 'package:ai_task_manager/shared/app_layout.dart';
import 'package:ai_task_manager/shared/navigation/app_tab.dart';

class _FakeAuthViewModel extends AuthViewModel {
  _FakeAuthViewModel(this._user);

  final UserEntity _user;

  @override
  Future<UserEntity?> build() async => _user;
}

const _admin = UserEntity(id: 'a', email: 'a@x.io', name: 'Admin', role: 'ADMIN');
const _member = UserEntity(id: 'm', email: 'm@x.io', name: 'Member', role: 'MEMBER');

GoRouter _buildRouter(String initialLocation) {
  return GoRouter(
    initialLocation: initialLocation,
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppLayout(navigationShell: shell),
        branches: [
          for (final tab in AppTab.values)
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: tab.rootPath,
                  builder: (context, state) => Text('page ${tab.name}'),
                ),
              ],
            ),
        ],
      ),
    ],
  );
}

Future<void> _pumpLayout(
  WidgetTester tester, {
  required UserEntity user,
  String initialLocation = '/dashboard',
  int unreadNotifications = 0,
  int unreadMessages = 0,
  int pendingMembers = 0,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        authStateProvider.overrideWith(() => _FakeAuthViewModel(user)),
        unreadCountProvider.overrideWithValue(unreadNotifications),
        unreadMessagesCountProvider.overrideWithValue(unreadMessages),
        pendingUsersCountProvider.overrideWith((ref) async => pendingMembers),
      ],
      child: MaterialApp.router(routerConfig: _buildRouter(initialLocation)),
    ),
  );
  await tester.pumpAndSettle();
}

Finder _destination(String label) => find.descendant(
      of: find.byType(NavigationBar),
      matching: find.text(label),
    );

void main() {
  testWidgets('un membre a 4 onglets, sans Dashboard', (tester) async {
    await _pumpLayout(tester, user: _member);

    expect(find.byType(NavigationDestination), findsNWidgets(4));
    expect(_destination('Dashboard'), findsNothing);
    expect(_destination('Projects'), findsOneWidget);
    expect(_destination('Profile'), findsOneWidget);
  });

  testWidgets('un admin a 5 onglets, Dashboard compris', (tester) async {
    await _pumpLayout(tester, user: _admin, initialLocation: '/overview');

    expect(find.byType(NavigationDestination), findsNWidgets(5));
    expect(_destination('Dashboard'), findsOneWidget);
    expect(find.text('page overview'), findsOneWidget);
  });

  testWidgets('affiche les badges de notifications, messages et équipe',
      (tester) async {
    await _pumpLayout(
      tester,
      user: _admin,
      unreadNotifications: 3,
      unreadMessages: 120,
      pendingMembers: 2,
    );

    final barBadges = find.descendant(
      of: find.byType(NavigationBar),
      matching: find.byType(Badge),
    );
    final visibleLabels = tester
        .widgetList<Badge>(barBadges)
        .where((badge) => badge.isLabelVisible)
        .map((badge) => (badge.label! as Text).data)
        .toSet();

    expect(visibleLabels, {'3', '99+', '2'});
  });

  testWidgets('n\'affiche pas de badge à zéro', (tester) async {
    await _pumpLayout(tester, user: _member);

    final visible = tester
        .widgetList<Badge>(find.byType(Badge))
        .where((badge) => badge.isLabelVisible);
    expect(visible, isEmpty);
  });

  testWidgets('change d\'onglet au tap', (tester) async {
    await _pumpLayout(tester, user: _member);
    expect(find.text('page projects'), findsOneWidget);

    await tester.tap(_destination('Messages'));
    await tester.pumpAndSettle();

    expect(find.text('page messages'), findsOneWidget);
    final bar = tester.widget<NavigationBar>(find.byType(NavigationBar));
    expect(bar.selectedIndex, 1);
  });
}
