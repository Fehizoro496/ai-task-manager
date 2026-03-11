import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ai_task_manager/core/widgets/sidebar.dart';
import 'package:ai_task_manager/features/auth/model/user_entity.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';

final sidebarCollapsedProvider = StateProvider<bool>((ref) => false);
final selectedNavIndexProvider = StateProvider<int>((ref) => 0);

class AppLayout extends ConsumerWidget {
  final Widget child;

  const AppLayout({super.key, required this.child});

  List<SidebarItem> _buildNavItems(UserEntity? user) {
    return [
      const SidebarItem(
        icon: Icons.dashboard_rounded,
        label: 'Dashboard',
        route: '/dashboard',
      ),
      const SidebarItem(
        icon: Icons.view_kanban_rounded,
        label: 'Board',
        route: '/board',
      ),
      const SidebarItem(
        icon: Icons.auto_awesome_rounded,
        label: 'AI Planning',
        route: '/ai-planning',
        showBadge: true,
      ),
      if (user?.isAdmin == true)
        const SidebarItem(
          icon: Icons.admin_panel_settings_rounded,
          label: 'Admin',
          route: '/admin',
        ),
      // const SidebarItem(
      //   icon: Icons.settings_rounded,
      //   label: 'Settings',
      //   route: '/settings',
      // ),
    ];
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCollapsed = ref.watch(sidebarCollapsedProvider);
    final selectedIndex = ref.watch(selectedNavIndexProvider);
    final authState = ref.watch(authStateProvider);
    final user = authState.valueOrNull;
    final userName = user?.name ?? '';
    final navItems = _buildNavItems(user);

    return Scaffold(
      body: Row(
        children: [
          AppSidebar(
            selectedIndex: selectedIndex,
            items: navItems,
            isCollapsed: isCollapsed,
            userName: userName,
            onItemSelected: (index) {
              ref.read(selectedNavIndexProvider.notifier).state = index;
              context.go(navItems[index].route);
            },
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
