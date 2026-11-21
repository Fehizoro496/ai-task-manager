import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:ai_task_manager/features/admin/view/admin_dashboard_screen.dart';
import 'package:ai_task_manager/features/admin/view/admin_overview_screen.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';
import 'package:ai_task_manager/shared/app_layout.dart';
import 'package:ai_task_manager/features/auth/view/login_screen.dart';
import 'package:ai_task_manager/features/auth/view/pending_approval_screen.dart';
import 'package:ai_task_manager/features/projects/view/dashboard_screen.dart';
import 'package:ai_task_manager/features/board/view/board_screen.dart';
import 'package:ai_task_manager/features/ai_planning/view/ai_planning_screen.dart';
import 'package:ai_task_manager/features/notifications/view/notifications_screen.dart';
import 'package:ai_task_manager/features/settings/view/settings_screen.dart';
import 'package:ai_task_manager/features/team/view/team_screen.dart';
import 'package:ai_task_manager/features/messages/view/messages_screen.dart';
import 'package:ai_task_manager/features/messages/view/conversation_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/login',
    redirect: (context, state) {
      final user = authState.valueOrNull;
      final isLoggedIn = user != null;
      final location = state.matchedLocation;

      final isAuthRoute = ['/login', '/pending-approval'].contains(location);

      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn && location == '/login') {
        return user.isAdmin ? '/overview' : '/dashboard';
      }
      if (location == '/admin' && isLoggedIn && !user.isAdmin) {
        return '/dashboard';
      }
      if (location == '/overview' && isLoggedIn && !user.isAdmin) {
        return '/dashboard';
      }
      if (location == '/team' && isLoggedIn && !user.isAdmin) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const LoginScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        ),
      ),
      GoRoute(
        path: '/pending-approval',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const PendingApprovalScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        ),
      ),
      // Écrans ouverts au-dessus de la barre de navigation.
      GoRoute(
        path: '/ai-planning',
        builder: (context, state) =>
            const FullScreenLayout(child: AiPlanningScreen()),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) =>
            const FullScreenLayout(child: AdminDashboardScreen()),
      ),
      GoRoute(
        path: '/team',
        builder: (context, state) =>
            const FullScreenLayout(child: TeamScreen()),
      ),
      // L'ordre des branches suit AppTab (branchIndex).
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppLayout(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/overview',
                builder: (context, state) => const AdminOverviewScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/dashboard',
                builder: (context, state) => const DashboardScreen(),
              ),
              GoRoute(
                path: '/board/:projectId',
                builder: (context, state) => BoardScreen(
                  projectId: state.pathParameters['projectId'] ?? 'default',
                  highlightTaskId: state.uri.queryParameters['taskId'],
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/messages',
                builder: (context, state) => const MessagesScreen(),
              ),
              GoRoute(
                path: '/messages/:conversationId',
                builder: (context, state) => ConversationScreen(
                  conversationId: state.pathParameters['conversationId']!,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/notifications',
                builder: (context, state) => const NotificationsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/settings',
                builder: (context, state) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
