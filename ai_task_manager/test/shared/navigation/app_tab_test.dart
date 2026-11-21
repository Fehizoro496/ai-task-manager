import 'package:flutter_test/flutter_test.dart';

import 'package:ai_task_manager/shared/navigation/app_tab.dart';

void main() {
  group('visibleTabs', () {
    test('un admin voit les 5 onglets, Dashboard en premier', () {
      expect(visibleTabs(isAdmin: true), [
        AppTab.overview,
        AppTab.projects,
        AppTab.messages,
        AppTab.notifications,
        AppTab.profile,
      ]);
    });

    test('un membre ne voit pas le Dashboard', () {
      expect(visibleTabs(isAdmin: false), [
        AppTab.projects,
        AppTab.messages,
        AppTab.notifications,
        AppTab.profile,
      ]);
    });
  });

  group('selectedTabIndex', () {
    test('décale les index pour un membre', () {
      final tabs = visibleTabs(isAdmin: false);

      expect(selectedTabIndex(tabs, AppTab.projects.branchIndex), 0);
      expect(selectedTabIndex(tabs, AppTab.profile.branchIndex), 3);
    });

    test('correspond à la branche pour un admin', () {
      final tabs = visibleTabs(isAdmin: true);

      expect(selectedTabIndex(tabs, AppTab.messages.branchIndex), 2);
    });

    test('retombe sur le premier onglet si la branche est masquée', () {
      final tabs = visibleTabs(isAdmin: false);

      expect(selectedTabIndex(tabs, AppTab.overview.branchIndex), 0);
    });
  });

  group('TabBadges', () {
    const badges = TabBadges(
      unreadNotifications: 3,
      unreadMessages: 5,
      pendingMembers: 2,
    );

    test('associe chaque compteur à son onglet', () {
      expect(badges.countFor(AppTab.notifications), 3);
      expect(badges.countFor(AppTab.messages), 5);
      expect(badges.countFor(AppTab.profile), 2);
      expect(badges.countFor(AppTab.projects), 0);
      expect(badges.countFor(AppTab.overview), 0);
    });
  });

  group('badgeLabel', () {
    test('masque le badge à zéro', () {
      expect(badgeLabel(0), isNull);
    });

    test('affiche le nombre', () {
      expect(badgeLabel(7), '7');
    });

    test('plafonne à 99+', () {
      expect(badgeLabel(120), '99+');
    });
  });
}
