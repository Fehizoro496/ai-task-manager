# AI Task Manager

## 1. Nom du projet + description

**AI Task Manager** — Application de gestion de projets collaborative, type Kanban, qui transforme un document de cahier des charges en plan structuré (Épics → Stories → Tâches) grâce à l'IA, et répartit automatiquement les tâches entre les membres selon leurs compétences. Elle intègre messagerie temps réel, notifications, calendrier d'événements et rapports analytiques.

## 2. Stack technique

### Backend
- **Langage** : JavaScript (Node.js)
- **Framework** : Express
- **Base de données** : PostgreSQL via Prisma (ORM)
- **Temps réel** : Socket.IO
- **Auth** : JWT + OAuth GitHub

### Frontend
- **Langage** : TypeScript
- **Framework** : Next.js 16 (App Router) + React 19
- **UI** : Tailwind CSS 4, Radix UI, dnd-kit (drag & drop Kanban)
- **State** : Zustand
- **Temps réel** : socket.io-client

### Services externes / IA
- **API IA** : Anthropic Claude (`@anthropic-ai/sdk`, modèle `claude-opus-4-8`) pour la génération de plans de projet à partir d'un document
- **GitHub** : authentification OAuth + création de branches liées aux tâches

## 3. Fonctionnalités principales

- **Génération de plan par IA** : un document de feature est découpé en Épics / Stories / Tâches (structured outputs Claude)
- **Tableau Kanban** : colonnes À faire / En cours / En revue / Terminé, drag & drop, mise à jour temps réel des cartes
- **Répartition automatique des tâches** : algorithme hongrois (Kuhn-Munkres) + score de compatibilité (compétences, disponibilité, performance) ; suggestion d'assigné par tâche
- **Compétences utilisateurs** : saisie manuelle + déduction automatique depuis l'historique des tâches terminées
- **Messagerie instantanée** : conversations directes et de groupe, badges de non-lus en temps réel, accusés de lecture (`lastReadAt`)
- **Notifications temps réel** : assignation, mise à jour, commentaires, avec redirections au clic
- **Calendrier** : échéances des tâches + événements personnalisés (visibilité publique / restreinte par utilisateurs ou projet)
- **Commentaires** sur les tâches
- **Rapports analytiques** : taux d'achèvement, distribution par statut/priorité/projet, top contributeurs
- **Gestion de projets** : membres, paramètres, intégration dépôt GitHub
- **Administration** : approbation des utilisateurs (workflow PENDING → APPROVED)
- **Préférences** : thème (clair/sombre), apparence, persistées par utilisateur

## 4. Architecture

### Type
**API REST monolithique** (Express) côté backend, consommée par le client web Next.js. Couche temps réel additionnelle via **Socket.IO** (rooms `user:<id>`, `project:<id>`, `conv:<id>`, `admins`). Documentation Swagger exposée sur `/api-docs`.

Organisation backend en **modules par domaine métier** (chaque module : `routes` → `controller` → `service`).

### Modules principaux (backend `src/modules/`)
- `auth` — authentification JWT + OAuth GitHub
- `users` — annuaire, profils, détails
- `admin` — approbation des utilisateurs, gestion des membres
- `projects` / `epics` / `stories` / `tasks` — hiérarchie de gestion de projet
- `ai` — génération de plan via Claude
- `distribution` — répartition de tâches (algorithme hongrois + scoring)
- `skills` — compétences utilisateurs (manuelles + dérivées)
- `chat` — messagerie temps réel
- `notifications` — notifications temps réel
- `comments` — commentaires de tâches
- `calendar` — échéances + événements personnalisés
- `reports` — agrégats analytiques
- `github` — intégration dépôts / branches

### Principaux espaces frontend (`src/app/(app)/`)
`dashboard`, `projects` (+ `board`, `members`, `settings`), `tasks`, `my-tasks`, `messages`, `calendar`, `reports`, `users`, `admin`, `ai`, `profile`, `settings`

## 5. Contenu des `package.json`

### `backend/package.json`

```json
{
  "name": "ai-task-manager",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "seed:admin": "node src/scripts/seed-admin.js",
    "seed:data": "node src/scripts/seed-data.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.100.1",
    "@prisma/client": "^6.3.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "google-auth-library": "^10.5.0",
    "jsonwebtoken": "^9.0.2",
    "socket.io": "^4.8.3",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.9",
    "prisma": "^6.3.0"
  }
}
```

### `frontend/package.json`

```json
{
  "name": "ai-task-manager",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@radix-ui/react-visually-hidden": "^1.2.4",
    "@swc/helpers": "^0.5.21",
    "caniuse-lite": "^1.0.30001792",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^1.16.0",
    "next": "16.2.6",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "socket.io-client": "^4.8.3",
    "tailwind-merge": "^3.6.0",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^5.0.13"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.6",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```
