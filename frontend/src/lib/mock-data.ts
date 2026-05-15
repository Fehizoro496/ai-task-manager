import type {
  AiConversation,
  ActivityItem,
  CalendarEvent,
  Comment,
  PlanEpic,
  Project,
  Task,
  User,
} from "./types";

export const currentUser: User = {
  id: "u_alex",
  name: "Alex Martin",
  email: "alex@example.com",
  role: "Administrateur",
  joinedAt: "2024-05-03",
  provider: "GitHub",
};

export const users: User[] = [
  currentUser,
  {
    id: "u_sarah",
    name: "Sarah Dupont",
    email: "sarah@example.com",
    role: "Membre",
    joinedAt: "2024-04-22",
    provider: "GitHub",
  },
  {
    id: "u_thomas",
    name: "Thomas Bernard",
    email: "thomas@example.com",
    role: "Membre",
    joinedAt: "2024-04-12",
    provider: "GitHub",
  },
  {
    id: "u_julie",
    name: "Julie Martin",
    email: "julie@example.com",
    role: "Membre",
    joinedAt: "2024-03-30",
    provider: "GitHub",
  },
  {
    id: "u_paul",
    name: "Paul Henry",
    email: "paul@example.com",
    role: "Lecteur",
    joinedAt: "2024-03-12",
    provider: "GitHub",
  },
];

export const projects: Project[] = [
  {
    id: "p_atm",
    name: "AI Task Manager",
    prefix: "AM",
    description:
      "Système complet de gestion de tâches avec assistance IA — épine dorsale interne de l'équipe produit.",
    color: "#6366F1",
    repo: "alex/ai-task-manager",
    createdAt: "2024-05-03",
    memberIds: ["u_alex", "u_sarah", "u_thomas", "u_julie"],
    category: "produit",
  },
  {
    id: "p_web",
    name: "Website Redesign",
    prefix: "WR",
    description: "Refonte complète du site corporate, focus performance et SEO.",
    color: "#14B8A6",
    repo: "alex/website",
    createdAt: "2024-04-12",
    memberIds: ["u_alex", "u_julie", "u_paul"],
    category: "marque",
  },
  {
    id: "p_mob",
    name: "Mobile App",
    prefix: "MA",
    description: "Application mobile native iOS/Android, MVP en juillet.",
    color: "#F59E0B",
    repo: "alex/mobile",
    createdAt: "2024-03-20",
    memberIds: ["u_alex", "u_thomas", "u_sarah"],
    category: "mobile",
  },
  {
    id: "p_api",
    name: "API Gateway",
    prefix: "AG",
    description: "Infrastructure et services : gateway unifiée, observabilité, quotas.",
    color: "#EC4899",
    repo: "alex/api-gateway",
    createdAt: "2024-03-04",
    memberIds: ["u_alex", "u_paul", "u_thomas"],
    category: "infra",
  },
];

// ---- Tasks (24 total) ---------------------------------------
const t = (
  i: number,
  partial: Omit<Task, "id" | "code" | "createdAt">,
): Task => ({
  id: `t_${i.toString().padStart(3, "0")}`,
  code: `${projects.find((p) => p.id === partial.projectId)!.prefix}-${i.toString().padStart(3, "0")}`,
  createdAt: "2024-05-02",
  ...partial,
});

export const tasks: Task[] = [
  // À faire
  t(101, {
    projectId: "p_atm",
    title: "Intégrer l'authentification OAuth",
    description:
      "Mettre en place le flux OAuth GitHub, gérer les tokens et la session, et préparer le refresh côté serveur.",
    status: "a_faire",
    priority: "elevee",
    assigneeId: "u_sarah",
    dueDate: "2024-05-22",
    labels: ["backend", "auth"],
    branch: "feat/am-101-oauth",
    storyId: "US-01",
    points: 5,
  }),
  t(102, {
    projectId: "p_atm",
    title: "Créer le tableau de bord",
    description: "Layout principal, KPIs, grille projets.",
    status: "a_faire",
    priority: "moyenne",
    assigneeId: "u_julie",
    dueDate: "2024-05-25",
    labels: ["frontend", "ui"],
    branch: "feat/am-102-dashboard",
    storyId: "US-02",
    points: 8,
  }),
  t(103, {
    projectId: "p_atm",
    title: "Configurer les notifications",
    description: "Préférences in-app, email, mentions.",
    status: "a_faire",
    priority: "faible",
    assigneeId: "u_thomas",
    dueDate: "2024-06-01",
    labels: ["backend"],
    branch: "feat/am-103-notif",
    storyId: "US-04",
    points: 3,
  }),
  // En cours
  t(104, {
    projectId: "p_atm",
    title: "Développer l'éditeur de tâches",
    description: "Modale complète : titre, description, méta, labels, story.",
    status: "en_cours",
    priority: "elevee",
    assigneeId: "u_alex",
    dueDate: "2024-05-18",
    labels: ["frontend"],
    branch: "feat/am-104-editor",
    storyId: "US-02",
    points: 5,
  }),
  t(105, {
    projectId: "p_atm",
    title: "API pour la gestion des projets",
    description:
      "Développer les endpoints REST pour la création, lecture, mise à jour et suppression des projets.",
    status: "en_cours",
    priority: "urgent",
    assigneeId: "u_sarah",
    dueDate: "2024-05-10",
    labels: ["backend", "api", "critical"],
    branch: "feat/am-105-api-projects",
    storyId: "US-03",
    points: 8,
  }),
  t(106, {
    projectId: "p_atm",
    title: "Tests d'intégration",
    description: "Suite Playwright sur les flows critiques.",
    status: "en_cours",
    priority: "moyenne",
    assigneeId: "u_thomas",
    dueDate: "2024-05-28",
    labels: ["qa"],
    branch: "test/am-106-e2e",
    storyId: "US-05",
    points: 5,
  }),
  // En revue
  t(107, {
    projectId: "p_atm",
    title: "Code review — Auth module",
    description: "Revue de la PR #128.",
    status: "en_revue",
    priority: "elevee",
    assigneeId: "u_alex",
    dueDate: "2024-05-12",
    labels: ["review", "auth"],
    branch: "feat/am-101-oauth",
    storyId: "US-01",
    points: 2,
  }),
  t(108, {
    projectId: "p_atm",
    title: "Review — API endpoints",
    description: "Vérifier la cohérence des contrats REST.",
    status: "en_revue",
    priority: "moyenne",
    assigneeId: "u_sarah",
    dueDate: "2024-05-14",
    labels: ["review", "api"],
    branch: "feat/am-105-api-projects",
    storyId: "US-03",
    points: 3,
  }),
  // Terminé
  t(97, {
    projectId: "p_atm",
    title: "UI — Composants de base",
    description: "Boutons, champs, badges, dialogs.",
    status: "termine",
    priority: "moyenne",
    assigneeId: "u_julie",
    dueDate: "2024-04-30",
    labels: ["frontend", "ui"],
    branch: "feat/am-097-ui",
    storyId: "US-02",
    points: 5,
  }),
  t(98, {
    projectId: "p_atm",
    title: "Modèles de données",
    description: "Schéma Prisma, migrations.",
    status: "termine",
    priority: "elevee",
    assigneeId: "u_thomas",
    dueDate: "2024-04-26",
    labels: ["backend", "db"],
    branch: "feat/am-098-models",
    storyId: "US-03",
    points: 8,
  }),
  t(99, {
    projectId: "p_atm",
    title: "Setup du projet",
    description: "CI, lint, hooks, conventions.",
    status: "termine",
    priority: "faible",
    assigneeId: "u_alex",
    dueDate: "2024-04-22",
    labels: ["infra"],
    branch: "chore/am-099-setup",
    points: 2,
  }),
  // Other projects
  t(110, {
    projectId: "p_web",
    title: "Corriger le bug d'export",
    description: "Le rendu PDF tronque la dernière page.",
    status: "a_faire",
    priority: "moyenne",
    assigneeId: "u_julie",
    dueDate: "2024-05-12",
    labels: ["bug"],
    points: 3,
  }),
  t(112, {
    projectId: "p_atm",
    title: "Revue de code — Auth module",
    description: "Lecture critique du module d'authentification.",
    status: "en_revue",
    priority: "elevee",
    assigneeId: "u_alex",
    dueDate: "2024-05-15",
    labels: ["review"],
    points: 3,
  }),
  t(115, {
    projectId: "p_api",
    title: "Rédiger la documentation API",
    description: "Référence OpenAPI + exemples.",
    status: "a_faire",
    priority: "faible",
    assigneeId: "u_paul",
    dueDate: "2024-05-20",
    labels: ["docs"],
    points: 5,
  }),
  t(120, {
    projectId: "p_mob",
    title: "Tests end-to-end",
    description: "Couverture des parcours principaux.",
    status: "en_cours",
    priority: "moyenne",
    assigneeId: "u_thomas",
    dueDate: "2024-05-18",
    labels: ["qa"],
    points: 8,
  }),
];

// Backfill totals per project from tasks
projects.forEach((p) => {
  const list = tasks.filter((t) => t.projectId === p.id);
  // Used by UI helpers
  (p as Project & { stats?: unknown }).stats = {
    total: list.length || (p.id === "p_atm" ? 96 : p.id === "p_web" ? 24 : p.id === "p_mob" ? 32 : 22),
    done: list.filter((x) => x.status === "termine").length || 48,
    active: list.filter((x) => x.status === "en_cours").length || 32,
    review: list.filter((x) => x.status === "en_revue").length || 16,
  };
});

export const comments: Comment[] = [
  {
    id: "c_01",
    taskId: "t_105",
    authorId: "u_sarah",
    body:
      "J'ai commencé l'implémentation de l'endpoint GET /projects. Question : on garde la pagination cursor-based ?",
    createdAt: "2024-05-09T15:02:00",
  },
  {
    id: "c_02",
    taskId: "t_105",
    authorId: "u_thomas",
    body:
      "N'oublie pas la pagination sur les filtres, sinon le front va tirer toute la table.",
    createdAt: "2024-05-09T16:45:00",
  },
];

export const activity: ActivityItem[] = [
  {
    id: "a_01",
    taskId: "t_105",
    actorId: "u_alex",
    text: "a changé la priorité en Urgent",
    createdAt: "2024-05-08T10:12:00",
  },
  {
    id: "a_02",
    taskId: "t_105",
    actorId: "u_sarah",
    text: "a poussé la branche feat/am-105-api-projects",
    createdAt: "2024-05-09T09:30:00",
  },
];

// ---- Calendar (May 2024) ------------------------------------
export const calendarEvents: CalendarEvent[] = [
  {
    id: "e_1",
    title: "API pour la gestion des projets",
    taskCode: "AM-105",
    date: "2024-05-15",
    start: "10:00",
    end: "12:00",
    color: "brand",
  },
  {
    id: "e_2",
    title: "Réunion équipe",
    date: "2024-05-15",
    start: "14:00",
    end: "15:00",
    color: "apricot",
  },
  {
    id: "e_3",
    title: "Revue de code",
    taskCode: "AM-112",
    date: "2024-05-15",
    start: "16:00",
    end: "17:00",
    color: "sage",
  },
  {
    id: "e_4",
    title: "Stand-up",
    date: "2024-05-16",
    start: "09:30",
    end: "09:45",
    color: "teal",
  },
  {
    id: "e_5",
    title: "Démo sprint",
    date: "2024-05-17",
    start: "15:00",
    end: "16:00",
    color: "rose",
  },
  {
    id: "e_6",
    title: "Planification IA",
    date: "2024-05-20",
    start: "11:00",
    end: "12:30",
    color: "brand",
  },
  {
    id: "e_7",
    title: "Rétro",
    date: "2024-05-24",
    start: "16:00",
    end: "17:30",
    color: "apricot",
  },
];

// ---- AI Conversations ---------------------------------------
export const aiConversations: AiConversation[] = [
  {
    id: "ai_1",
    title: "Plan pour l'application mobile",
    updatedAt: "2024-05-14",
    preview:
      "Décomposer le MVP iOS/Android en epics et stories, livrable juin.",
  },
  {
    id: "ai_2",
    title: "Optimisation des tâches",
    updatedAt: "2024-05-12",
    preview: "Recommandations pour fusionner des doublons du backlog.",
  },
  {
    id: "ai_3",
    title: "Analyse du projet",
    updatedAt: "2024-05-09",
    preview:
      "Diagnostic du sprint en cours : vélocité, blocage et risques.",
  },
  {
    id: "ai_4",
    title: "Idées de fonctionnalités",
    updatedAt: "2024-05-04",
    preview: "Pistes pour la v2, hiérarchisées par impact/effort.",
  },
];

// ---- Generated plan (for AI wizard preview) -----------------
export const generatedPlan: PlanEpic[] = [
  {
    id: "ep_1",
    title: "Gestion des utilisateurs",
    stories: [
      {
        id: "st_1",
        title: "Inscription et authentification",
        tasks: [
          { id: "tk_1", title: "Page d'inscription", priority: "moyenne" },
          { id: "tk_2", title: "Validation email", priority: "moyenne" },
          { id: "tk_3", title: "Connexion utilisateur", priority: "elevee" },
        ],
      },
      {
        id: "st_2",
        title: "Gestion du profil",
        tasks: [
          { id: "tk_4", title: "Page profil", priority: "moyenne" },
          { id: "tk_5", title: "Modifier informations", priority: "faible" },
          { id: "tk_6", title: "Photo de profil", priority: "faible" },
          { id: "tk_7", title: "Préférences notif.", priority: "faible" },
        ],
      },
    ],
  },
  {
    id: "ep_2",
    title: "Catalogue de cours",
    stories: [
      {
        id: "st_3",
        title: "Liste des cours",
        tasks: [
          { id: "tk_8", title: "Recherche", priority: "moyenne" },
          { id: "tk_9", title: "Filtres", priority: "moyenne" },
          { id: "tk_10", title: "Tri par pertinence", priority: "faible" },
        ],
      },
    ],
  },
];

// ---- Sidebar nav --------------------------------------------
export const sidebarNav = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/projects", label: "Projets" },
  { href: "/my-tasks", label: "Mes tâches" },
  { href: "/ai/new", label: "IA Planification" },
  { href: "/calendar", label: "Calendrier" },
  { href: "/reports", label: "Rapports" },
  { href: "/settings", label: "Paramètres" },
];
