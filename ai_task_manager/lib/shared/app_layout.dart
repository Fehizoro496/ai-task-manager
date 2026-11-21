import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ai_task_manager/features/admin/viewmodel/admin_viewmodel.dart';
import 'package:ai_task_manager/features/auth/view/widgets/auth_layout.dart';
import 'package:ai_task_manager/features/auth/viewmodel/auth_viewmodel.dart';
import 'package:ai_task_manager/features/notifications/viewmodel/notification_viewmodel.dart';
import 'package:ai_task_manager/features/messages/viewmodel/chat_viewmodel.dart';
import 'package:ai_task_manager/shared/navigation/app_tab.dart';

/// Coque des onglets : contenu de la branche active et barre de navigation.
class AppLayout extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const AppLayout({super.key, required this.navigationShell});

  static const _labels = {
    AppTab.overview: 'Dashboard',
    AppTab.projects: 'Projects',
    AppTab.messages: 'Messages',
    AppTab.notifications: 'Notifications',
    AppTab.profile: 'Profile',
  };

  static const _icons = {
    AppTab.overview: (Icons.bar_chart_outlined, Icons.bar_chart_rounded),
    AppTab.projects: (Icons.folder_outlined, Icons.folder_rounded),
    AppTab.messages: (Icons.chat_bubble_outline_rounded, Icons.chat_bubble_rounded),
    AppTab.notifications: (Icons.notifications_none_rounded, Icons.notifications_rounded),
    AppTab.profile: (Icons.person_outline_rounded, Icons.person_rounded),
  };

  void _onTabSelected(AppTab tab) {
    // Un second appui sur l'onglet actif revient à sa racine.
    navigationShell.goBranch(
      tab.branchIndex,
      initialLocation: tab.branchIndex == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).valueOrNull;
    final isAdmin = user?.isAdmin == true;
    final badges = TabBadges(
      unreadNotifications: ref.watch(unreadCountProvider),
      unreadMessages: ref.watch(unreadMessagesCountProvider),
      pendingMembers:
          isAdmin ? ref.watch(pendingUsersCountProvider).valueOrNull ?? 0 : 0,
    );
    final tabs = visibleTabs(isAdmin: isAdmin);
    final homeTab = tabs.first;
    final isOnHomeTab = navigationShell.currentIndex == homeTab.branchIndex;

    // Retour Android depuis un autre onglet : revient au premier onglet ;
    // depuis le premier, laisse le système quitter l'app.
    return PopScope(
      canPop: isOnHomeTab,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) navigationShell.goBranch(homeTab.branchIndex);
      },
      child: _buildScaffold(tabs, badges),
    );
  }

  Widget _buildScaffold(List<AppTab> tabs, TabBadges badges) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AuthBackground(
        child: SafeArea(bottom: false, child: navigationShell),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedTabIndex(tabs, navigationShell.currentIndex),
        onDestinationSelected: (index) => _onTabSelected(tabs[index]),
        destinations: [
          for (final tab in tabs)
            NavigationDestination(
              icon: _TabIcon(icon: _icons[tab]!.$1, badge: badges.countFor(tab)),
              selectedIcon:
                  _TabIcon(icon: _icons[tab]!.$2, badge: badges.countFor(tab)),
              label: _labels[tab]!,
            ),
        ],
      ),
    );
  }
}

class _TabIcon extends StatelessWidget {
  final IconData icon;
  final int badge;

  const _TabIcon({required this.icon, required this.badge});

  @override
  Widget build(BuildContext context) {
    final label = badgeLabel(badge);
    return Badge(
      isLabelVisible: label != null,
      label: label == null ? null : Text(label),
      child: Icon(icon),
    );
  }
}

/// Fond et zones sûres des écrans plein écran, ouverts au-dessus de la barre.
class FullScreenLayout extends StatelessWidget {
  final Widget child;

  const FullScreenLayout({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return AuthBackground(child: SafeArea(child: child));
  }
}
