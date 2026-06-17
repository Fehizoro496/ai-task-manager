"use client";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Singleton de navigation. Le router Next est injecte une fois (via
 * RouterBridge) puis n'importe quel code peut appeler push/replace/back
 * sans avoir besoin du hook useRouter.
 */
let bound: AppRouterInstance | null = null;
const queue: Array<() => void> = [];

const flush = () => {
  if (!bound) return;
  while (queue.length > 0) {
    const fn = queue.shift();
    fn?.();
  }
};

/** Appele depuis RouterBridge a chaque mount/changement du router Next. */
export const bindRouter = (router: AppRouterInstance) => {
  bound = router;
  flush();
};

export const unbindRouter = () => {
  bound = null;
};

const exec = (fn: (r: AppRouterInstance) => void) => {
  if (bound) fn(bound);
  else queue.push(() => bound && fn(bound));
};

/** Heuristique : URL absolue ou protocole-relative → externe. */
export const isExternalUrl = (href: string): boolean => {
  if (!href) return false;
  return /^([a-z][a-z0-9+\-.]*:|\/\/)/i.test(href);
};

export const routerService = {
  push: (href: string) => {
    if (isExternalUrl(href)) {
      routerService.openExternal(href);
      return;
    }
    exec((r) => r.push(href));
  },
  replace: (href: string) => {
    if (isExternalUrl(href)) {
      routerService.openExternal(href);
      return;
    }
    exec((r) => r.replace(href));
  },
  back: () => exec((r) => r.back()),
  forward: () => exec((r) => r.forward()),
  refresh: () => exec((r) => r.refresh()),
  prefetch: (href: string) => {
    if (isExternalUrl(href)) return;
    exec((r) => r.prefetch(href));
  },

  /** Ouvre un lien dans un nouvel onglet (utilise window.open avec
   *  rel='noopener noreferrer'). Utilise typiquement pour les liens
   *  externes (repo GitHub, doc, etc.). */
  openExternal: (href: string) => {
    if (typeof window === "undefined") return;
    window.open(href, "_blank", "noopener,noreferrer");
  },

  /** Ouvre n'importe quel href (interne OU externe) dans un nouvel onglet,
   *  pour reproduire le ctrl/⌘+clic ou un bouton "ouvrir dans un onglet". */
  openInNewTab: (href: string) => {
    if (typeof window === "undefined") return;
    window.open(href, "_blank", "noopener,noreferrer");
  },

  // ---------- Helpers types (sources de verite des chemins) ----------
  paths: {
    dashboard: () => "/dashboard",
    login: () => "/login",
    pending: () => "/pending",
    projects: () => "/projects",
    project: (id: string) => `/projects/${id}`,
    projectBoard: (id: string) => `/projects/${id}/board`,
    projectMembers: (id: string) => `/projects/${id}/members`,
    projectSettings: (id: string) => `/projects/${id}/settings`,
    tasks: () => "/my-tasks",
    task: (id: string) => `/tasks/${id}`,
    newTask: () => "/tasks/new",
    user: (id: string) => `/users/${id}`,
    profile: () => "/profile",
    settings: () => "/settings",
    admin: () => "/admin",
    messages: () => "/messages",
    aiNew: () => "/ai/new",
    calendar: () => "/calendar",
    reports: () => "/reports",
  },

  // ---------- Raccourcis nommes ----------
  toHome: () => routerService.push(routerService.paths.dashboard()),
  toDashboard: () => routerService.push(routerService.paths.dashboard()),
  toLogin: () => routerService.replace(routerService.paths.login()),
  toPending: () => routerService.replace(routerService.paths.pending()),
  toProjects: () => routerService.push(routerService.paths.projects()),
  toProject: (id: string) =>
    routerService.push(routerService.paths.project(id)),
  toProjectBoard: (id: string) =>
    routerService.push(routerService.paths.projectBoard(id)),
  toProjectMembers: (id: string) =>
    routerService.push(routerService.paths.projectMembers(id)),
  toProjectSettings: (id: string) =>
    routerService.push(routerService.paths.projectSettings(id)),
  toMyTasks: () => routerService.push(routerService.paths.tasks()),
  toTask: (id: string) => routerService.push(routerService.paths.task(id)),
  toNewTask: () => routerService.push(routerService.paths.newTask()),
  toUser: (id: string) => routerService.push(routerService.paths.user(id)),
  toProfile: () => routerService.push(routerService.paths.profile()),
  toSettings: () => routerService.push(routerService.paths.settings()),
  toAdmin: () => routerService.push(routerService.paths.admin()),
  toMessages: () => routerService.push(routerService.paths.messages()),
  toAiNew: () => routerService.push(routerService.paths.aiNew()),
  toCalendar: () => routerService.push(routerService.paths.calendar()),
  toReports: () => routerService.push(routerService.paths.reports()),
};
