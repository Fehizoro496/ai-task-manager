import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

const _fullScreenPrefixes = ['/board/', '/messages/'];
const _fullScreenPaths = ['/team', '/admin', '/ai-planning'];

/// Vrai si [location] s'ouvre en plein écran, au-dessus de la barre de navigation.
bool isFullScreenLocation(String location) {
  final path = Uri.parse(location).path;
  return _fullScreenPaths.contains(path) ||
      _fullScreenPrefixes.any(
        (prefix) => path.startsWith(prefix) && path.length > prefix.length,
      );
}

/// Ouvre [location] : empilé s'il est plein écran (le retour Android revient
/// à l'écran d'origine), sinon en changeant d'onglet.
void openLocation(BuildContext context, String location) {
  if (isFullScreenLocation(location)) {
    context.push(location);
  } else {
    context.go(location);
  }
}
