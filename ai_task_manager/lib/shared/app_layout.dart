import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ai_task_manager/core/widgets/sidebar.dart';

final sidebarCollapsedProvider = StateProvider<bool>((ref) => false);
final selectedNavIndexProvider = StateProvider<int>((ref) => 0);

class AppLayout extends ConsumerWidget {
  final Widget child;

  const AppLayout({super.key, required this.child});

  static const _navItems = [
    SidebarItem(
      icon: Icons.dashboard_rounded,
      label: 'Dashboard',
      route: '/dashboard',
    ),
    SidebarItem(
      icon: Icons.view_kanban_rounded,
      label: 'Board',
      route: '/board',
    ),
    SidebarItem(
      icon: Icons.auto_awesome_rounded,
      label: 'AI Planning',
      route: '/ai-planning',
      showBadge: true,
    ),
    SidebarItem(
      icon: Icons.settings_rounded,
      label: 'Settings',
      route: '/settings',
    ),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCollapsed = ref.watch(sidebarCollapsedProvider);
    final selectedIndex = ref.watch(selectedNavIndexProvider);

    return Scaffold(
      body: Row(
        children: [
          AppSidebar(
            selectedIndex: selectedIndex,
            items: _navItems,
            isCollapsed: isCollapsed,
            onItemSelected: (index) {
              ref.read(selectedNavIndexProvider.notifier).state = index;
            },
            onToggleCollapse: () {
              ref.read(sidebarCollapsedProvider.notifier).state = !isCollapsed;
            },
          ),
          Expanded(child: child),
        ],
      ),
    );
  }
}
