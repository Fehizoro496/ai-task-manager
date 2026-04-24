import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Redirige vers /login — l'inscription se fait via GitHub OAuth.
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
