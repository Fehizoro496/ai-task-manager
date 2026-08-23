"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tasksApi } from "../api/tasks.api";
import type { MyTasksQuery, MyTasksScope, MyTasksSort } from "../api/tasks.api";
import type { Task, TaskPriority } from "../api/types";

/** Taille d'un lot. Le suivant est demandé en arrivant au bas du tableau. */
export const MY_TASKS_PAGE_SIZE = 30;

export interface MyTasksFilters {
  scope: MyTasksScope;
  q: string;
  priorities: TaskPriority[];
  projectIds: string[];
  sort: MyTasksSort;
}

interface PageState {
  tasks: Task[];
  total: number;
  hasMore: boolean;
}

const EMPTY_PAGE: PageState = { tasks: [], total: 0, hasMore: false };

/** Une tâche mise à jour localement sort de la liste si elle ne satisfait plus
 *  les filtres actifs — évite de garder une ligne devenue hors périmètre. */
const stillMatches = (task: Task, filters: MyTasksQuery): boolean => {
  if (filters.scope === "active" && task.status === "done") return false;
  if (filters.scope === "done" && task.status !== "done") return false;
  const priority = (task.priority ?? "medium") as TaskPriority;
  if (filters.priorities?.length && !filters.priorities.includes(priority)) return false;
  if (filters.projectIds?.length && !filters.projectIds.includes(task.projectId ?? "")) {
    return false;
  }
  return true;
};

/**
 * Liste paginée des tâches de l'utilisateur. Filtrage, recherche et tri sont
 * délégués au serveur : le hook n'accumule que les lots déjà reçus et redemande
 * le suivant via `loadMore`. Tout changement de filtre repart de la page 0.
 */
export function useMyTasks(filters: MyTasksFilters) {
  // Clé stable : deux objets `filters` distincts mais équivalents ne doivent
  // pas relancer un chargement. Elle porte aussi les paramètres envoyés au
  // serveur, ce qui garantit que la requête correspond toujours à la clé.
  const key = useMemo(
    () =>
      JSON.stringify({
        scope: filters.scope,
        q: filters.q.trim(),
        priorities: [...filters.priorities].sort(),
        projectIds: [...filters.projectIds].sort(),
        sort: filters.sort,
      } satisfies MyTasksQuery),
    [
      filters.scope,
      filters.q,
      filters.priorities,
      filters.projectIds,
      filters.sort,
    ],
  );

  const [page, setPage] = useState<PageState>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Numéro de requête : toute réponse antérieure à la dernière demande est
  // ignorée, ce qui évite qu'un filtre abandonné écrase la liste courante.
  const requestIdRef = useRef(0);
  const busyRef = useRef(false);

  const load = useCallback(
    async (offset: number) => {
      const requestId = ++requestIdRef.current;
      busyRef.current = true;
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      const query = JSON.parse(key) as MyTasksQuery;
      try {
        const res = await tasksApi.listMine({
          ...query,
          limit: MY_TASKS_PAGE_SIZE,
          offset,
        });
        if (requestId !== requestIdRef.current) return;

        setPage((curr) => {
          if (offset === 0) {
            return { tasks: res.tasks, total: res.total, hasMore: res.hasMore };
          }
          // Une tâche peut changer de page si la liste bouge côté serveur entre
          // deux lots : on dédoublonne plutôt que de dupliquer une ligne.
          const known = new Set(curr.tasks.map((t) => t.id));
          return {
            tasks: [...curr.tasks, ...res.tasks.filter((t) => !known.has(t.id))],
            total: res.total,
            hasMore: res.hasMore,
          };
        });
        setError(null);
      } catch (e) {
        if (requestId !== requestIdRef.current) return;
        setError(e as Error);
        if (offset === 0) setPage(EMPTY_PAGE);
      } finally {
        if (requestId === requestIdRef.current) {
          busyRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [key],
  );

  useEffect(() => {
    load(0);
  }, [load]);

  /** Demande le lot suivant. Sans effet si une requête est déjà en vol. */
  const loadMore = useCallback(() => {
    if (busyRef.current || !page.hasMore) return;
    load(page.tasks.length);
  }, [load, page.hasMore, page.tasks.length]);

  const refresh = useCallback(() => load(0), [load]);

  /** Applique une tâche modifiée ailleurs (dialog détail) sans tout recharger,
   *  pour ne pas perdre la position de défilement. */
  const applyUpdate = useCallback(
    (updated: Task) => {
      const active = JSON.parse(key) as MyTasksQuery;
      setPage((curr) => {
        if (!curr.tasks.some((t) => t.id === updated.id)) return curr;
        if (!stillMatches(updated, active)) {
          return {
            ...curr,
            tasks: curr.tasks.filter((t) => t.id !== updated.id),
            total: Math.max(curr.total - 1, 0),
          };
        }
        return {
          ...curr,
          tasks: curr.tasks.map((t) =>
            t.id === updated.id ? { ...t, ...updated } : t,
          ),
        };
      });
    },
    [key],
  );

  const removeLocal = useCallback((id: string) => {
    setPage((curr) => {
      if (!curr.tasks.some((t) => t.id === id)) return curr;
      return {
        ...curr,
        tasks: curr.tasks.filter((t) => t.id !== id),
        total: Math.max(curr.total - 1, 0),
      };
    });
  }, []);

  return {
    tasks: page.tasks,
    total: page.total,
    hasMore: page.hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
    applyUpdate,
    removeLocal,
  };
}

export type { MyTasksScope, MyTasksSort };
