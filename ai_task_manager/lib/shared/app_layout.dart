import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ai_task_manager/core/widgets/sidebar.dart';
import 'package:ai_task_manager/features/admin/viewmodel/admin_viewmodel.dart';
import 'package:ai_task_manager/features/auth/model/user_entity.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';
import 'package:ai_task_manager/features/notifications/viewmodel/notification_viewmodel.dart';
import 'package:ai_task_manager/features/messages/viewmodel/chat_viewmodel.dart';

final sidebarCollapsedProvider = StateProvider<bool>((ref) => false);
// Kept for logout invalidation only — active index is derived from route location.
final selectedNavIndexProvider = StateProvider<int>((ref) => 0);

class AppLayout extends ConsumerWidget {
  final Widget child;

  const AppLayout({super.key, required this.child});

  List<SidebarItem> _buildNavItems(
      UserEntity? user, int unreadCount, int unreadMessages, int pendingCount) {
    return [
      if (user?.isAdmin == true)
        const SidebarItem(
          icon: Icons.bar_chart_rounded,
          label: 'Dashboard',
          route: '/overview',
        ),
      const SidebarItem(
        icon: Icons.folder_rounded,
        label: 'Projects',
        route: '/dashboard',
      ),
      if (user?.isAdmin == true)
        SidebarItem(
          icon: Icons.people_rounded,
          label: 'Team',
          route: '/team',
          showBadge: pendingCount > 0,
          badgeCount: pendingCount > 0 ? pendingCount : null,
        ),
      SidebarItem(
        icon: Icons.notifications_rounded,
        label: 'Notifications',
        route: '/notifications',
        showBadge: unreadCount > 0,
        badgeCount: unreadCount > 0 ? unreadCount : null,
      ),
      SidebarItem(
        icon: Icons.chat_bubble_rounded,
        label: 'Messages',
        route: '/messages',
        showBadge: unreadMessages > 0,
        badgeCount: unreadMessages > 0 ? unreadMessages : null,
      ),
      const SidebarItem(
        icon: Icons.settings_rounded,
        label: 'Settings',
        route: '/settings',
      ),
    ];
  }

  int _selectedIndexFromLocation(String location, List<SidebarItem> items) {
    for (int i = 0; i < items.length; i++) {
      final route = items[i].route;
      if (location == route || location.startsWith('$route/')) return i;
    }
    // /board/* is under Projects (/dashboard)
    if (location.startsWith('/board/')) {
      final idx = items.indexWhere((e) => e.route == '/dashboard');
      if (idx != -1) return idx;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCollapsed = ref.watch(sidebarCollapsedProvider);
    final authState = ref.watch(authStateProvider);
    final user = authState.valueOrNull;
    final userName = user?.name ?? '';
    final unreadCount = ref.watch(unreadCountProvider);
    final unreadMessages = ref.watch(unreadMessagesCountProvider);
    final pendingCount = user?.isAdmin == true
        ? ref.watch(pendingUsersCountProvider).valueOrNull ?? 0
        : 0;
    final navItems = _buildNavItems(user, unreadCount, unreadMessages, pendingCount);

    final location = GoRouterState.of(context).uri.path;
    final selectedIndex = _selectedIndexFromLocation(location, navItems);

    return Scaffold(
      body: Row(
        children: [
          AppSidebar(
            selectedIndex: selectedIndex,
            items: navItems,
            isCollapsed: isCollapsed,
            userName: userName,
            userAvatarUrl: user?.avatarUrl,
            onItemSelected: (index) => context.go(navItems[index].route),
            onToggleCollapse: () {
              ref.read(sidebarCollapsedProvider.notifier).state = !isCollapsed;
            },
            onLogout: () => ref.read(authStateProvider.notifier).logout(),
          ),
          Expanded(child: child),
        ],
      ),
    );
  }
}
