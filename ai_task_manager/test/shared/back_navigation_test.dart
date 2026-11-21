import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:ai_task_manager/features/admin/viewmodel/admin_viewmodel.dart';
import 'package:ai_task_manager/features/auth/model/user_entity.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';
import 'package:ai_task_manager/features/messages/viewmodel/chat_viewmodel.dart';
import 'package:ai_task_manager/features/notifications/viewmodel/notification_viewmodel.dart';
import 'package:ai_task_manager/shared/app_layout.dart';
import 'package:ai_task_manager/shared/navigation/app_navigation.dart';
import 'package:ai_task_manager/shared/navigation/app_tab.dart';

class _FakeAuthViewModel extends AuthViewModel {
  @override
  Future<UserEntity?> build() async =>
      const UserEntity(id: 'm', email: 'm@x.io', name: 'Member');
}

/// Même structure que le routeur de l'app : routes plein écran à la racine,
/// onglets dans un StatefulShellRoute.
GoRouter _buildRouter() {
  final rootKey = GlobalKey<NavigatorState>();
  return GoRouter(
    navigatorKey: rootKey,
    initialLocation: '/dashboard',
    routes: [
      GoRoute(
        path: '/board/:projectId',
        builder: (context, state) => FullScreenLayout(
          child: Text('board ${state.pathParameters['projectId']}'),
        ),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppLayout(navigationShell: shell),
        branches: [
          for (final tab in AppTab.values)
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: tab.rootPath,
                  builder: (context, state) => Column(
                    children: [
                      Text('page ${tab.name}'),
                      TextButton(
                        onPressed: () => openLocation(context, '/board/p1'),
                        child: Text('open board from ${tab.name}'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
        ],
      ),
    ],
  );
}

void main() {
  late List<MethodCall> platformCalls;

  setUp(() {
    platformCalls = [];
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(SystemChannels.platform, (call) async {
      platformCalls.add(call);
      return null;
    });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(SystemChannels.platform, null);
  });

  Future<void> pumpApp(WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authStateProvider.overrideWith(_FakeAuthViewModel.new),
          unreadCountProvider.overrideWithValue(0),
          unreadMessagesCountProvider.overrideWithValue(0),
          pendingUsersCountProvider.overrideWith((ref) async => 0),
        ],
        child: MaterialApp.router(routerConfig: _buildRouter()),
      ),
    );
    await tester.pumpAndSettle();
  }

  Future<void> pressBack(WidgetTester tester) async {
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
  }

  bool exitedApp() =>
      platformCalls.any((call) => call.method == 'SystemNavigator.pop');

  Finder destination(String label) => find.descendant(
        of: find.byType(NavigationBar),
        matching: find.text(label),
      );

  testWidgets('le board s\'ouvre en plein écran, sans barre de navigation',
      (tester) async {
    await pumpApp(tester);

    await tester.tap(find.text('open board from projects'));
    await tester.pumpAndSettle();

    expect(find.text('board p1'), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);
  });

  testWidgets('le retour depuis le board revient à l\'onglet d\'origine',
      (tester) async {
    await pumpApp(tester);
    await tester.tap(destination('Notifications'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('open board from notifications'));
    await tester.pumpAndSettle();

    await pressBack(tester);

    expect(find.text('board p1'), findsNothing);
    expect(find.text('page notifications'), findsOneWidget);
    expect(find.byType(NavigationBar), findsOneWidget);
    expect(exitedApp(), isFalse);
  });

  testWidgets('le retour depuis un autre onglet revient au premier onglet',
      (tester) async {
    await pumpApp(tester);
    await tester.tap(destination('Messages'));
    await tester.pumpAndSettle();

    await pressBack(tester);

    expect(find.text('page projects'), findsOneWidget);
    final bar = tester.widget<NavigationBar>(find.byType(NavigationBar));
    expect(bar.selectedIndex, 0);
    expect(exitedApp(), isFalse);
  });

  testWidgets('le retour depuis le premier onglet quitte l\'app',
      (tester) async {
    await pumpApp(tester);

    await pressBack(tester);

    expect(exitedApp(), isTrue);
  });
}
