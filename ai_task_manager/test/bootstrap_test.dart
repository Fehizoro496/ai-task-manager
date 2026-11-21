import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:ai_task_manager/bootstrap.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final platformCalls = <MethodCall>[];

  setUp(() {
    platformCalls.clear();
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

  group('bootstrap', () {
    // Non-régression : main() appelait prefs.clear() et déconnectait
    // l'utilisateur à chaque lancement.
    test('conserve la session en cache au démarrage', () async {
      SharedPreferences.setMockInitialValues({
        'cached_auth_token': 'jwt-token',
        'cached_user_id': 'user-1',
      });

      final prefs = await bootstrap();

      expect(prefs.getString('cached_auth_token'), 'jwt-token');
      expect(prefs.getString('cached_user_id'), 'user-1');
    });

    test('verrouille l\'orientation en portrait', () async {
      SharedPreferences.setMockInitialValues({});

      await bootstrap();

      final orientationCall = platformCalls.singleWhere(
        (call) => call.method == 'SystemChrome.setPreferredOrientations',
      );
      expect(orientationCall.arguments, ['DeviceOrientation.portraitUp']);
    });

    test('active le mode edge-to-edge', () async {
      SharedPreferences.setMockInitialValues({});

      await bootstrap();

      final uiModeCall = platformCalls.singleWhere(
        (call) => call.method == 'SystemChrome.setEnabledSystemUIMode',
      );
      expect(uiModeCall.arguments, 'SystemUiMode.edgeToEdge');
    });
  });
}
