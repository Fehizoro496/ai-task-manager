# Plan de migration — client Flutter vers Android

**Décision (19/11/2026) :** le client Flutter [ai_task_manager/](../ai_task_manager/) devient une application **mobile, Android uniquement**. Le desktop (Windows / macOS) est abandonné ; le web reste couvert par Next.js.

Ce plan décrit, écran par écran, ce qu'il faut adapter. Il s'appuie sur l'état du code au 19/11/2026 et sur COMPARAISON_FLUTTER.md pour l'écart fonctionnel.

---

## État de départ

| Élément | Constat |
|---|---|
| Plateformes | Seuls `windows/` et `macos/` existent ; pas de dossier `android/`. |
| Dépendances desktop | `window_manager` est déclarée dans [pubspec.yaml](../ai_task_manager/pubspec.yaml) mais n'est utilisée nulle part dans `lib/`. |
| Navigation | Sidebar repliable ([sidebar.dart](../ai_task_manager/lib/core/widgets/sidebar.dart)) dans une `Row` ([app_layout.dart](../ai_task_manager/lib/shared/app_layout.dart)). |
| Survol | `MouseRegion` / `onHover` dans 19 fichiers (boutons, cartes, colonnes, tuiles). Sans effet sur mobile : il faut un retour visuel au toucher à la place. |
| Largeurs fixes | Dialogues de 480 px, colonnes Kanban de 260 px, grilles à 3 colonnes. |
| Panneau de tâche | [task_detail_panel.dart](../ai_task_manager/lib/features/board/view/task_detail_panel.dart) s'ouvre en dialogue de 480 px. |
| Réseau | `API_BASE_URL` par défaut `http://localhost:3000/api` : ne fonctionne pas sur un appareil Android. |
| OAuth GitHub | Ouverture du navigateur externe puis polling de `/auth/github/status/:state` : compatible Android tel quel. |
| Session | [main.dart:12](../ai_task_manager/lib/main.dart#L12) appelle `prefs.clear()` à chaque lancement et déconnecte donc l'utilisateur. Inacceptable sur mobile. |
| Design system | [design.md](../ai_task_manager/design.md) prévoit déjà des breakpoints mobiles et des cibles tactiles de 44 px. |

---

## Phase 0 — Socle Android

| # | Action | Détail |
|---|---|---|
| 0.1 | Générer le projet Android | `fvm flutter create --platforms=android --org com.aitaskmanager --project-name ai_task_manager .` dans `ai_task_manager/` (ne touche pas à `lib/`), puis fixer `applicationId` et `namespace` à **`com.aitaskmanager.mobile`** dans `android/app/build.gradle(.kts)`. Vérifier sur le Play Store que l'identifiant est libre avant la première publication. |
| 0.2 | Supprimer le desktop | Retirer `windows/`, `macos/` et la dépendance `window_manager`. |
| 0.3 | Permissions et réseau | `INTERNET` dans `AndroidManifest.xml` (main, pas seulement debug). En dev HTTP : `network_security_config` autorisant le cleartext pour l'hôte de dev uniquement. |
| 0.4 | URL d'API | Émulateur : `--dart-define=API_BASE_URL=http://10.0.2.2:3000/api`. Appareil physique : IP LAN de la machine ou tunnel. Socket.IO réutilise la même URL ([socket_service.dart](../ai_task_manager/lib/core/network/socket_service.dart)). |
| 0.5 | Persistance de session | Supprimer `prefs.clear()` dans [main.dart](../ai_task_manager/lib/main.dart). Envisager `flutter_secure_storage` pour le JWT (aujourd'hui en `SharedPreferences`). |
| 0.6 | Orientation et UI système | Verrouiller en portrait (`SystemChrome.setPreferredOrientations`), gérer `SafeArea` et la barre de navigation Android (edge-to-edge). |
| 0.7 | Vérifier les plugins natifs | `sqlite3_flutter_libs` (Drift), `path_provider`, `url_launcher` et `socket_io_client` sont compatibles Android. Pour `url_launcher` sur Android 11+, déclarer `<queries>` pour les intents `https`. |
| 0.8 | Bouton retour Android | Vérifier que go_router gère le retour système (sortie d'une conversation, d'un board, fermeture d'une bottom sheet). |

**Critère de sortie :** l'app se lance sur un émulateur, la connexion GitHub aboutit et la session survit à un redémarrage.

---

## Phase 1 — Navigation

Remplacer la sidebar par une **barre de navigation en bas** (`NavigationBar` Material 3) via `StatefulShellRoute.indexedStack` de go_router, pour conserver l'état de chaque onglet.

| Onglet | Membre | Admin | Route actuelle |
|---|---|---|---|
| Accueil / Dashboard | — | ✅ | `/overview` |
| Projets | ✅ | ✅ | `/dashboard` (+ `/board/:id` empilé) |
| Messages | ✅ | ✅ | `/messages` (+ `/messages/:id`) |
| Notifications | ✅ | ✅ | `/notifications` |
| Profil | ✅ | ✅ | `/settings` |

- **5 onglets maximum.** « Team » (admin) devient une entrée de l'onglet Profil ou de l'accueil admin, avec son badge de demandes en attente.
- **Planification IA :** l'écran est aujourd'hui inaccessible. Ajouter une action « Planifier avec l'IA » dans l'en-tête d'un projet (admin), plutôt qu'un onglet.
- Les badges (notifications, messages non lus, demandes en attente) passent sur les icônes de la barre.
- `board`, `conversation` et `ai-planning` s'affichent en plein écran, au-dessus de la barre (`parentNavigatorKey: _rootNavigatorKey`).
- Supprimer `sidebarCollapsedProvider` et [sidebar.dart](../ai_task_manager/lib/core/widgets/sidebar.dart). Déplacer la déconnexion dans Profil.

---

## Phase 2 — Design system tactile

Dans [lib/core/design_system/](../ai_task_manager/lib/core/design_system/) :

| Composant | Adaptation |
|---|---|
| `AppButton`, `AppCard`, `TaskCard` | Remplacer les effets `MouseRegion` par `InkWell` / état pressé ; hauteur minimale de 44–48 px. |
| `AppDialog` | Remplacer les dialogues centrés de 480 px par des **bottom sheets** (`showModalBottomSheet`, `isScrollControlled`, `DraggableScrollableSheet`) ou par des pages plein écran pour les formulaires longs. |
| `KanbanColumn` | Voir la phase 3. |
| `AppToast` | Vérifier le positionnement par rapport à la barre du bas et au clavier. |
| Thème | Rester sur `ThemeMode.system` par défaut ; vérifier les contrastes en mode sombre sur OLED. |
| Typographie | Appliquer l'échelle mobile de [design.md](../ai_task_manager/design.md) (titres réduits) ; tester avec un `textScaler` à 1,3. |

Les 4 usages de `showDialog` / `showGeneralDialog` sont à migrer : [app_dialog.dart](../ai_task_manager/lib/core/design_system/app_dialog.dart), [admin_dashboard_screen.dart](../ai_task_manager/lib/features/admin/view/admin_dashboard_screen.dart) (confirmation, peut rester un `AlertDialog`), [project_members_dialog.dart](../ai_task_manager/lib/features/admin/view/project_members_dialog.dart) et [task_detail_panel.dart](../ai_task_manager/lib/features/board/view/task_detail_panel.dart).

---

## Phase 3 — Écran par écran

### Authentification

| Écran | Adaptation | Effort |
|---|---|---|
| [login_screen.dart](../ai_task_manager/lib/features/auth/view/login_screen.dart) | Mise en page déjà contrainte à 380 px : vérifier le scroll quand le clavier est ouvert et la `SafeArea`. | Faible |
| Flux GitHub | **Décision (20/11/2026) : garder le polling actuel** (navigateur externe + `/auth/github/status/:state`). Le retour automatique par deep link n'est pas prévu. | — |
| Polling | Point de vigilance : si l'app passe en arrière-plan pendant l'OAuth, le `Future.delayed` peut être suspendu. Relancer la vérification au retour au premier plan (`AppLifecycleListener`). | Faible |
| [pending_approval_screen.dart](../ai_task_manager/lib/features/auth/view/pending_approval_screen.dart) | Compatible ; ajouter un « tirer pour rafraîchir ». | Faible |

### Projets — [dashboard_screen.dart](../ai_task_manager/lib/features/projects/view/dashboard_screen.dart)

- Grille de 2 à 3 colonnes → **liste verticale** (1 colonne).
- Le bouton « New Project » devient un `FloatingActionButton` (admin).
- [create_project_dialog.dart](../ai_task_manager/lib/features/projects/view/create_project_dialog.dart) devient une page ou une bottom sheet plein écran.
- Le menu de la carte (supprimer) devient un appui long ou un menu `⋮`.
- Ajouter le « tirer pour rafraîchir ».

### Kanban — [board_screen.dart](../ai_task_manager/lib/features/board/view/board_screen.dart) *(chantier principal)*

Le board desktop affiche 4 colonnes de 260 px côte à côte avec défilement horizontal et glisser-déposer.

**Décision (20/11/2026) : garder un vrai Kanban, sur le modèle de l'application mobile de Trello.**

| Élément | Comportement attendu |
|---|---|
| Colonnes | Une colonne par statut, d'environ 85 % de la largeur de l'écran ; on aperçoit le bord de la suivante. Défilement horizontal **aimanté** (une colonne à la fois) et indicateur de position (points). |
| En-tête de colonne | Nom du statut et nombre de cartes. |
| Cartes | Labels en pastilles de couleur, identifiant, titre, échéance et avatar de l'assigné. Un tap ouvre le détail en plein écran. |
| Glisser-déposer | **Appui long** pour saisir une carte (retour haptique), dépôt à n'importe quelle position de la colonne (met à jour `order`). |
| Changement de colonne | En amenant la carte au bord gauche ou droit de l'écran, le board **défile automatiquement** vers la colonne voisine. |
| Défilement vertical | Défilement automatique vers le haut ou le bas quand la carte approche des bords d'une colonne longue. |
| Ajout | Bouton « + Ajouter une tâche » en bas de chaque colonne, saisie rapide du titre directement dans la colonne. |
| Droits | Les cartes que l'utilisateur ne peut pas déplacer (ni admin, ni assigné) ne se saisissent pas ; un appui long affiche un message. |
| Filtres | Priorité dans une rangée de chips défilante sous l'en-tête du projet. |

Mise en œuvre :
- Réutiliser la logique actuelle (`Draggable` / `DragTarget`, `PATCH /tasks/:id/move`) avec `LongPressDraggable`, un `PageView` (ou `ListView` horizontal avec `PageScrollPhysics`) et des zones de défilement automatique aux bords.
- Évaluer le package `appflowy_board`, qui gère déjà le glisser-déposer entre colonnes et le défilement automatique, avant d'écrire la version maison. Trancher au début de M1.
- [add_task_inline.dart](../ai_task_manager/lib/features/board/view/add_task_inline.dart) reste un ajout dans la colonne, adapté au clavier mobile.
- Retirer la `_FloatingScrollbar` et les hauteurs calculées en `MediaQuery.height - 140`.
- Garder un sélecteur de statut dans le détail de tâche, comme alternative au glisser-déposer.

### Détail de tâche — [task_detail_panel.dart](../ai_task_manager/lib/features/board/view/task_detail_panel.dart)

- Le dialogue de 480 px devient une **page plein écran** (`/board/:projectId/task/:taskId`). Le deep link depuis les notifications en profite.
- Titre, description, statut, priorité, assigné, labels et échéance s'empilent verticalement ; « Save Changes » passe dans une barre d'action fixe en bas.
- Le sélecteur d'assigné devient une bottom sheet avec recherche.
- La saisie de labels doit rester utilisable avec le clavier ouvert (scroll vers le champ).
- La branche GitHub devient un lien « Copier » ou « Ouvrir ».

### Messages — [messages_screen.dart](../ai_task_manager/lib/features/messages/view/messages_screen.dart), [conversation_screen.dart](../ai_task_manager/lib/features/messages/view/conversation_screen.dart)

- Structure liste → conversation déjà adaptée au mobile.
- Gérer le clavier : `resizeToAvoidBottomInset`, champ de saisie collé au clavier, scroll automatique vers le dernier message.
- Bulles : largeur max de 65 % à porter à environ 80 %.
- **Cycle de vie du socket :** se reconnecter au retour au premier plan, se rejoindre aux conversations, et recharger les messages manqués pendant l'arrière-plan.

### Notifications — [notifications_screen.dart](../ai_task_manager/lib/features/notifications/view/notifications_screen.dart)

- Liste compatible ; ajouter le « tirer pour rafraîchir » et le glissement pour marquer comme lu.
- **Notifications push** (nouveau sur mobile) : FCM via `firebase_messaging`, plus un envoi côté backend. Sans push, l'utilisateur ne reçoit rien app fermée. À traiter comme une phase à part (voir la phase 5).

### Paramètres / Profil — [settings_screen.dart](../ai_task_manager/lib/features/settings/view/settings_screen.dart)

- Devient l'onglet « Profil » : infos utilisateur, thème, déconnexion et, pour les admins, les entrées « Équipe » et « Vue d'ensemble » si elles ne sont pas en onglet.

### Administration

| Écran | Adaptation |
|---|---|
| [admin_overview_screen.dart](../ai_task_manager/lib/features/admin/view/admin_overview_screen.dart) | KPI en grille 2×2 (compatible) ; donuts empilés ; grille de projets en 1 colonne. **Performance :** il charge toutes les tâches de tous les projets ; sur réseau mobile, prévoir un endpoint de statistiques côté backend. |
| [team_screen.dart](../ai_task_manager/lib/features/team/view/team_screen.dart) / [admin_dashboard_screen.dart](../ai_task_manager/lib/features/admin/view/admin_dashboard_screen.dart) | Les deux écrans se recoupent (liste d'utilisateurs filtrée par statut) : **les fusionner** en un seul écran « Équipe ». Approbation et refus par glissement ou boutons sur la tuile. |
| [project_members_dialog.dart](../ai_task_manager/lib/features/admin/view/project_members_dialog.dart) | Devient une page « Membres » accessible depuis l'en-tête du projet. |

### Planification IA — [ai_planning_screen.dart](../ai_task_manager/lib/features/ai_planning/view/ai_planning_screen.dart)

- Accès depuis le projet (voir la phase 1).
- **Saisie du cahier des charges :** coller un long texte sur mobile est peu pratique. Ajouter l'**import de fichier** (`file_picker` : `.txt` / `.md`, voire `.pdf` si le backend l'accepte).
- Les aperçus epic / story / task deviennent des listes dépliables (`ExpansionTile`).
- « Approuver » et « Rejeter » passent dans une barre fixe en bas.
- La génération est longue : garder l'écran actif ou permettre de quitter et revenir (le brouillon est déjà persisté).

---

## Phase 4 — Ajustements de fond

| Sujet | Action |
|---|---|
| Hors ligne | Le cache Drift existe déjà : afficher les données en cache immédiatement, ajouter un bandeau « hors ligne » et désactiver les actions d'écriture sans réseau. |
| Temps réel | Étendre le socket au Kanban et aux notifications (voir COMPARAISON_FLUTTER.md), avec reconnexion au premier plan. |
| Non-lus | Persister le compteur de messages non lus côté serveur (aujourd'hui en mémoire uniquement). |
| Codegen | Les changements de modèles (freezed / json / drift / riverpod) demandent de relancer `build_runner`, à lancer manuellement. |

---

## Phase 5 — Fonctionnalités propres au mobile (optionnel)

| Fonctionnalité | Intérêt | Dépendances |
|---|---|---|
| Notifications push (FCM) | Indispensable pour l'usage mobile réel. | `firebase_messaging`, projet Firebase, endpoint backend d'enregistrement des tokens. |
| Image de tâche depuis l'appareil photo | Couvre l'image de tâche absente aujourd'hui. | `image_picker` + upload multipart. |
| Partage vers l'app | Envoyer un texte ou un fichier vers la planification IA. | `receive_sharing_intent`. |
| Biométrie | Déverrouillage rapide de la session. | `local_auth`. |

---

## Ce qui ne s'applique plus

Dans FONCTIONNALITES.md et COMPARAISON_FLUTTER.md, à mettre à jour :

- FONCTIONNALITES.md:3 et FONCTIONNALITES.md:119 : « application desktop Flutter » devient « application mobile Android Flutter ».
- La recherche globale `Ctrl/Cmd + K` devient, sur mobile, une **icône de recherche** dans l'en-tête.
- Les effets au survol et l'infobulle de l'assigné sont remplacés par un appui long ou par l'affichage direct.
- Les favoris dans la navigation deviennent des projets épinglés en haut de la liste.

---

## Ordre recommandé et estimation

| Étape | Contenu | Effort |
|---|---|---|
| 1 | Phase 0 (socle Android, session, réseau) | 1–2 j |
| 2 | Phase 1 (navigation en bas, routes plein écran) | 1–2 j |
| 3 | Phase 2 (design system tactile, bottom sheets) | 2–3 j |
| 4 | Kanban style Trello + détail de tâche plein écran | 5–7 j |
| 5 | Projets, messages, notifications, profil | 2–3 j |
| 6 | Admin (fusion Team/Admin, overview) + IA (import de fichier) | 2–3 j |
| 7 | Phase 4 (hors ligne, temps réel, cycle de vie) | 2–4 j |
| 8 | Phase 5 (push FCM, etc.) | après la 1.0 |

Soit **environ 15 à 24 jours** de développement pour les étapes 1 à 7, hors backend (OAuth deep link, endpoint de statistiques, push).

## Décisions prises (20/11/2026)

1. **Kanban :** vrai Kanban à colonnes, sur le modèle de l'application mobile de Trello (voir la phase 3).
2. **OAuth :** polling actuel conservé.
3. **Push FCM :** reporté après la version 1.0.
4. **`applicationId` :** `com.aitaskmanager.mobile`.
5. **Distribution :** Play Store public, plus tard ; APK signé en attendant. Conserver le keystore de signature dès la bêta (hors dépôt) et activer Play App Signing à la publication.
