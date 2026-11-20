# Démo soutenance — Nexa Delivery

## 1. Création du projet

**Nom**

```
Nexa Delivery
```

**Description**

```
Plateforme de commande et de suivi de livraison en temps réel : back-office web pour les restaurateurs, applications mobiles pour les clients et les livreurs, API de commande et paiement en ligne.
```

**Préfixe d'identifiant** : `NDL` (tâches `NDL-001`, `NDL-002`…) — laisser vide génère `ND` automatiquement.

**Couleur suggérée** : `#0EA5E9` (se distingue des projets existants).

> Le projet doit être créé par le compte **Andrian**, propriétaire : la génération de plan n'est accessible qu'au propriétaire du projet.

---

## 2. Script pour l'IA de génération de tâches

À coller tel quel dans le champ document de l'assistant de génération de plan.

```
Nexa Delivery — plateforme de commande et de livraison de repas.

Trois clients : une application mobile Flutter pour le client final, une application mobile Flutter pour le livreur, et un back-office web Next.js / React pour les restaurateurs et l'équipe support. Le tout s'appuie sur une API REST Node.js avec base PostgreSQL et une couche temps réel.

Compte et authentification
Inscription par e-mail et mot de passe, connexion OAuth Google, réinitialisation du mot de passe par lien e-mail, et rôles distincts client / livreur / restaurateur / support. Les sessions sont gérées par jeton JWT avec rafraîchissement automatique.

Catalogue et commande
Le client parcourt les restaurants proches, filtre par cuisine, note et délai de livraison, consulte la carte d'un restaurant avec ses menus et ses options (taille, suppléments, allergènes). Il compose son panier, applique un code promotionnel, choisit une adresse de livraison enregistrée ou saisie sur une carte, puis valide la commande. Le paiement se fait par carte bancaire via Stripe, avec justificatif envoyé par e-mail.

Suivi en temps réel
Une fois la commande acceptée par le restaurant, le client suit son état (acceptée, en préparation, prête, en route, livrée) et la position du livreur sur une carte rafraîchie en direct. Une notification push est envoyée à chaque changement d'état. Un fil de discussion permet au client de contacter le livreur pendant la course.

Application livreur
Le livreur se met en ligne ou hors ligne, reçoit les courses proposées à proximité, accepte ou refuse, obtient l'itinéraire vers le restaurant puis vers le client, et confirme la livraison par photo ou code. Un écran récapitule ses gains de la journée et de la semaine.

Back-office restaurateur
Gestion de la carte (plats, catégories, prix, disponibilité, photos), horaires d'ouverture, acceptation ou refus des commandes entrantes, tableau de bord du chiffre d'affaires et des plats les plus vendus, export des ventes en CSV.

Support et administration
Recherche d'une commande par numéro, remboursement total ou partiel, modération des avis clients, suspension d'un compte livreur ou restaurateur.

Qualité et exploitation
Interface responsive et accessible, mode sombre, temps de chargement du catalogue optimisé par mise en cache. Tests automatisés sur les parcours de commande et de paiement, conteneurisation Docker de l'API et pipeline d'intégration continue avec déploiement automatique sur l'environnement de recette.
```

---

## 3. Instructions de raffinage (mode discussion)

À garder sous la main pour démontrer l'affinage du plan après la première génération :

```
Ajoute un programme de fidélité : cumul de points par commande et conversion en réduction.
```

```
Regroupe les tâches de paiement et détaille la gestion des échecs de transaction.
```

```
Supprime les tâches liées au support et à l'administration, hors périmètre de la première version.
```

---

## 4. Repères pour la répartition automatique

Le brief est calibré sur les compétences réellement enregistrées, pour que l'algorithme de répartition donne un résultat lisible devant le jury :

| Membre | Compétences | Reçoit typiquement |
| --- | --- | --- |
| Alice Martin | react 5, ui 4, design 4, css 4 | back-office et écrans web |
| Bob Dupont | node 5, api 5, database 4, auth 3 | API, modèle de données, authentification |
| Chloé Bernard | flutter 5, dart 5, mobile 4, ui 3 | applications client et livreur |
| David Leroy | testing 5, ci 4, docker 4, devops 4 | tests, conteneurisation, pipeline |
| Emma Petit | react 4, node 4, api 3, fullstack 4 | paiement, temps réel, transverse |

Labels du catalogue couverts par le brief : `api`, `auth`, `ci`, `css`, `dart`, `database`, `design`, `devops`, `docker`, `flutter`, `mobile`, `navigation`, `next`, `node`, `optimisation`, `payment`, `react`, `realtime`, `testing`, `typescript`, `ui`.
