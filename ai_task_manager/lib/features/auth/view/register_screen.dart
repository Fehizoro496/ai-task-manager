import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN D'INSCRIPTION CLASSIQUE - COMMENTÉ
// ══════════════════════════════════════════════════════════════════════════════
// La version précédente contenait un formulaire d'inscription complet avec
// les champs : name, email, password, confirmPassword
// Pour restaurer cette fonctionnalité, référez-vous au commit précédent.
// ══════════════════════════════════════════════════════════════════════════════

/// Redirige vers /login — l'inscription se fait via GitHub OAuth uniquement.
class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  static const String routeName = '/register';

  @override
  Widget build(BuildContext context) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.go('/login');
    });
    return const SizedBox.shrink();
  }
}
