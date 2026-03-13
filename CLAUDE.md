# Conventions

## Git commits
- Ne jamais ajouter Claude ou Anthropic comme co-auteur (`Co-Authored-By`).

## Build runner
- Ne jamais lancer `flutter pub run build_runner` automatiquement.
- Notifier l'utilisateur quand la commande doit être lancée, puis attendre sa confirmation pour continuer.

## Flutter CLI
- Si `flutter` n'est pas disponible dans le PATH, utiliser `fvm flutter` à la place.
