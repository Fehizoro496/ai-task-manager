import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:ai_task_manager/features/admin/view/admin_dashboard_screen.dart';
import 'package:ai_task_manager/features/admin/view/admin_overview_screen.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';
import 'package:ai_task_manager/shared/app_layout.dart';
import 'package:ai_task_manager/features/auth/view/login_screen.dart';
import 'package:ai_task_manager/features/auth/view/pending_approval_screen.dart';
import 'package:ai_task_manager/features/auth/view/register_screen.dart';
import 'package:ai_task_manager/features/projects/view/dashboard_screen.dart';
import 'package:ai_task_manager/features/board/view/board_screen.dart';
import 'package:ai_task_manager/features/ai_planning/view/ai_planning_screen.dart';
import 'package:ai_task_manager/features/notifications/view/notifications_screen.dart';
import 'package:ai_task_manager/features/settings/view/settings_screen.dart';
import 'package:ai_task_manager/features/team/view/team_screen.dart';
import 'package:ai_task_manager/features/messages/view/messages_screen.dart';
import 'package:ai_task_manager/features/messages/view/conversation_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/login',
    redirect: (context, state) {
      final user = authState.valueOrNull;
      final isLoggedIn = user != null;
      final location = state.matchedLocation;

      final isAuthRoute = ['/login', '/register', '/pending-approval']
          .contains(location);

      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn && (location == '/login' || location == '/register')) {
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
        path: '/register',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const RegisterScreen(),
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
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => AppLayout(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const DashboardScreen(),
              transitionsBuilder:
                  (context, animation, secondaryAnimation, child) {
                return FadeTransition(opacity: animation, child: child);
              },
            ),
          ),
          GoRoute(
            path: '/board/:projectId',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: BoardScreen(
                projectId: state.pathParameters['projectId'] ?? 'default',
                highlightTaskId: state.uri.queryParameters['taskId'],
              ),
              transitionsBuilder:
                  (context, animation, secondaryAnimation, child) {
                return FadeTransition(opacity: animation, child: child);
              },
            ),
          ),
          GoRoute(
            path: '/ai-planning',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const AiPlanningScreen(),
              transitionsBuilder:
                  (context, animation, secondaryAnimation, child) {
                return FadeTransition(opacity: animation, child: child);
              },
            ),
          ),
          GoRoute(
            path: '/admin',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const AdminDashboardScreen(),
              transitionsBuilder:
                  (context, animation, secondaryAnimation, child) {
                return FadeTransition(opacity: animation, child: child);
              },
            ),
          ),
          GoRoute(
            path: '/overview',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const AdminOverviewScreen(),
              transitionsBuilder:
                  (context, animation, secondaryAnimation, child) =>
                      FadeTransition(opacity: animation, child: child),
            ),
          ),
          GoRoute(
            path: '/team',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const TeamScreen(),
              transitionsBuilder:
                  (context, animation, secondaryAnimation, child) =>
                      FadeTransition(opacity: animation, child: child),
            ),
          ),
          GoRoute(
            path: '/notifications',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const NotificationsScreen(),
              transitionsBuilder:
                  (context, animation, secondaryAnimation, child) =>
                      FadeTransition(opacity: animation, child: child),
            ),
          ),
          GoRoute(
            path: '/messages',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const MessagesScreen(),
              transitionsBuilder:
                  (context, animation, secondaryAnimation, child) =>
                      FadeTransition(opacity: animation, child: child),
            ),
          ),
          GoRoute(
            path: '/messages/:conversationId',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: ConversationScreen(
                conversationId:
                    state.pathParameters['conversationId']!,
              ),
              transitionsBuilder:
                  (context, animation, secondaryAnimation, child) =>
                      FadeTransition(opacity: animation, child: child),
            ),
          ),
          GoRoute(
            path: '/settings',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const SettingsScreen(),
              transitionsBuilder:
                  (context, animation, secondaryAnimation, child) {
                return FadeTransition(opacity: animation, child: child);
              },
            ),
          ),
        ],
      ),
    ],
  );
});
