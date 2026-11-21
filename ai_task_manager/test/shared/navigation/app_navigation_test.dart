import 'package:flutter_test/flutter_test.dart';

import 'package:ai_task_manager/shared/navigation/app_navigation.dart';

void main() {
  group('isFullScreenLocation', () {
    test('le board et la conversation sont plein écran', () {
      expect(isFullScreenLocation('/board/p1'), isTrue);
      expect(isFullScreenLocation('/board/p1?taskId=t1'), isTrue);
      expect(isFullScreenLocation('/messages/c1'), isTrue);
    });

    test('team, admin et ai-planning sont plein écran', () {
      expect(isFullScreenLocation('/team'), isTrue);
      expect(isFullScreenLocation('/admin'), isTrue);
      expect(isFullScreenLocation('/ai-planning'), isTrue);
    });

    test('les racines des onglets ne le sont pas', () {
      expect(isFullScreenLocation('/dashboard'), isFalse);
      expect(isFullScreenLocation('/messages'), isFalse);
      expect(isFullScreenLocation('/messages/'), isFalse);
      expect(isFullScreenLocation('/notifications'), isFalse);
      expect(isFullScreenLocation('/settings'), isFalse);
      expect(isFullScreenLocation('/overview'), isFalse);
    });
  });
}
