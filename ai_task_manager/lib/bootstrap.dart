import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Prépare l'application avant `runApp` : UI système Android et préférences.
///
/// Les préférences ne sont jamais effacées ici : elles portent la session
/// (token et utilisateur en cache), qui doit survivre à un redémarrage.
Future<SharedPreferences> bootstrap() async {
  await configureSystemUi();
  return SharedPreferences.getInstance();
}

/// Verrouille l'app en portrait et active l'affichage edge-to-edge.
Future<void> configureSystemUi() async {
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Color(0x00000000),
      systemNavigationBarColor: Color(0x00000000),
      systemNavigationBarContrastEnforced: false,
    ),
  );
}
