/// Onglets de la barre de navigation du bas.
///
/// L'ordre des valeurs est celui des branches du `StatefulShellRoute` :
/// `branchIndex` correspond donc à l'index de la branche dans le routeur.
enum AppTab {
  overview('/overview', adminOnly: true),
  projects('/dashboard'),
  messages('/messages'),
  notifications('/notifications'),
  profile('/settings');

  const AppTab(this.rootPath, {this.adminOnly = false});

  final String rootPath;
  final bool adminOnly;

  int get branchIndex => index;
}

/// Onglets affichés pour un utilisateur : un membre ne voit pas le Dashboard.
List<AppTab> visibleTabs({required bool isAdmin}) =>
    AppTab.values.where((tab) => isAdmin || !tab.adminOnly).toList();

/// Position dans [tabs] de l'onglet qui porte la branche [branchIndex].
/// Retombe sur le premier onglet si la branche n'est pas visible.
int selectedTabIndex(List<AppTab> tabs, int branchIndex) {
  final index = tabs.indexWhere((tab) => tab.branchIndex == branchIndex);
  return index < 0 ? 0 : index;
}

/// Compteurs affichés en badge sur les onglets.
class TabBadges {
  const TabBadges({
    this.unreadNotifications = 0,
    this.unreadMessages = 0,
    this.pendingMembers = 0,
  });

  final int unreadNotifications;
  final int unreadMessages;

  /// Demandes d'accès en attente, portées par l'onglet Profil (entrée Équipe).
  final int pendingMembers;

  int countFor(AppTab tab) => switch (tab) {
        AppTab.notifications => unreadNotifications,
        AppTab.messages => unreadMessages,
        AppTab.profile => pendingMembers,
        AppTab.overview || AppTab.projects => 0,
      };
}

/// Texte du badge, ou `null` s'il ne doit pas être affiché.
String? badgeLabel(int count) {
  if (count <= 0) return null;
  return count > 99 ? '99+' : '$count';
}
