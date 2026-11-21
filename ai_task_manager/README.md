# ai_task_manager

Client Android (Flutter) d'AI Task Manager. `applicationId` : `com.aitaskmanager.mobile`.

## Lancer l'app

Si `flutter` n'est pas dans le PATH, préfixer les commandes par `fvm`.

```sh
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Émulateur Android

L'URL d'API par défaut est `http://10.0.2.2:3000/api` (la machine hôte vue depuis l'émulateur) :

```sh
flutter run
```

### Appareil physique

Le téléphone doit joindre le backend, par l'IP de la machine sur le réseau local ou par un tunnel HTTPS :

```sh
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:3000/api
```

Le HTTP en clair n'est autorisé qu'en debug, et seulement pour `10.0.2.2`, `localhost` et `127.0.0.1`
([network_security_config.xml](android/app/src/debug/res/xml/network_security_config.xml)).
Pour une IP du réseau local, utiliser un tunnel HTTPS ou ajouter temporairement l'IP à ce fichier.

Socket.IO réutilise la même URL.

## Tests

```sh
flutter test
```
