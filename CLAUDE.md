# Conventions

## Git commits
- Ne jamais ajouter Claude ou Anthropic comme co-auteur (`Co-Authored-By`).

## Build runner
- Ne jamais lancer `flutter pub run build_runner` automatiquement.
- Notifier l'utilisateur quand la commande doit être lancée, puis attendre sa confirmation pour continuer.

## Flutter CLI
- Si `flutter` n'est pas disponible dans le PATH, utiliser `fvm flutter` à la place.

## Tests
- Toute nouvelle fonctionnalité (ou modification de comportement) doit être livrée avec les tests correspondants, dans le même changement.
- Tester en priorité la logique métier (entités, value objects, services de domaine, cas d'usage) avec des tests unitaires, puis les intégrations (repositories, API) et l'interface si pertinent.
- Toute correction de bug s'accompagne d'un test de non-régression qui reproduit le bug.
- Emplacements :
  - Flutter (`ai_task_manager`) : `test/`, en miroir de l'arborescence de `lib/` ; lancer avec `flutter test`.
  - Backend : `backend/tests/` (réutiliser les helpers de `backend/tests/helpers/`).
  - Frontend : `frontend/tests/` (Vitest).
- Lancer les tests concernés avant de considérer une tâche terminée, et signaler explicitement tout test en échec ou non écrit.

## Architecture (DDD)
- Privilégier le Domain-Driven Design pour tout nouveau code et lors des refactorings :
  - **Domain** : entités, value objects, agrégats, services de domaine et interfaces de repositories. Pur, sans dépendance au framework, à la base de données, au réseau ou à l'UI.
  - **Application** : cas d'usage qui orchestrent le domaine ; aucune règle métier dans les vues, viewmodels, contrôleurs ou routes.
  - **Infrastructure** : implémentations concrètes (repositories, DAOs, clients HTTP, Prisma, API IA).
  - **Presentation** : vues/viewmodels (Flutter), pages/composants (Next.js), routes/contrôleurs (backend), qui délèguent aux cas d'usage.
- Les dépendances pointent vers le domaine : la couche domaine ne dépend d'aucune autre couche.
- Organiser le code par bounded context (projects, tasks, ai_planning, messages…) et utiliser le langage ubiquitaire du métier dans les noms.
- Le code existant (structure `data/model/service/view/viewmodel`) est migré progressivement : appliquer le DDD aux parties touchées sans lancer de refonte globale non demandée.

## Workflow multi-agents (obligatoire)

Rôles :
- Claude = chef de projet + reviewer. Tu ne codes PAS toi-même les tâches d'implémentation.
- Codex = exécutant. Toute implémentation passe par le sous-agent codex:codex-rescue.

Pour chaque demande :
1. PLAN : découpe en tâches petites et indépendantes. Pour chacune, écris une spec
   précise : fichiers concernés, comportement attendu, contraintes (architecture,
   state management, conventions du projet), critères d'acceptation.
2. CHECKPOINT : `git add -A && git commit -m "checkpoint avant <tâche>"`.
3. DÉLÉGATION : envoie la spec à Codex (codex:codex-rescue). Une tâche à la fois.
4. REVUE : une fois Codex terminé :
   - `git diff` et lis tout le diff
   - `flutter analyze` puis `flutter test`
   - vérifie la spec : critères remplis, rien hors périmètre, pas de régression
5. VERDICT :
   - OK → commit avec un message clair
   - Problèmes mineurs → renvoie à Codex avec la liste précise des corrections (--resume)
   - Mauvaise direction → `git reset --hard` au checkpoint et réécris la spec
   Maximum 2 allers-retours par tâche ; ensuite, arrête-toi et demande-moi.
6. Résumé final : tâches faites, problèmes trouvés en revue, points à vérifier par moi.