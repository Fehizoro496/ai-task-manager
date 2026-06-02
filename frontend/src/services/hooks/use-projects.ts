"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { create as createStore } from "zustand";
import { projectsApi } from "../api/projects.api";
import type { CreateProjectInput, UpdateProjectInput } from "../api/projects.api";
import type { Project } from "../api/types";
import { useAuthStore } from "../auth/auth-store";

/**
 * Store partagé : toutes les pages utilisant useProject / useProjects voient
 * la même source de vérité. Une mise à jour depuis n'importe quel composant
 * (settings, modale de création, etc.) se répercute partout sans refresh.
 */
interface ProjectsState {
  byId: Record<string, Project>;
  allFetched: boolean;
  loading: boolean;
  error: Error | null;
  fetchAll: () => Promise<void>;
  fetchOne: (id: string) => Promise<Project | null>;
  upsert: (project: Project) => void;
  removeFromCache: (id: string) => void;
  reset: () => void;
}

const useProjectsStore = createStore<ProjectsState>((set, get) => ({
  byId: {},
  allFetched: false,
  loading: false,
  error: null,
  fetchAll: async () => {
    set({ loading: true });
    try {
      const list = await projectsApi.list();
      const byId: Record<string, Project> = {};
      for (const p of list) byId[p.id] = p;
      set({ byId, allFetched: true, error: null });
    } catch (e) {
      set({ error: e as Error });
    } finally {
      set({ loading: false });
    }
  },
  fetchOne: async (id: string) => {
    try {
      const p = await projectsApi.getById(id);
      set((s) => ({ byId: { ...s.byId, [p.id]: p } }));
      return p;
    } catch (e) {
      set({ error: e as Error });
      return null;
    }
  },
  upsert: (project) =>
    set((s) => ({ byId: { ...s.byId, [project.id]: project } })),
  removeFromCache: (id) =>
    set((s) => {
      const next = { ...s.byId };
      delete next[id];
      return { byId: next };
    }),
  reset: () =>
    set({ byId: {}, allFetched: false, loading: false, error: null }),
}));

export function useProjects() {
  const isAuth = useAuthStore((s) => s.status === "authenticated");
  const byId = useProjectsStore((s) => s.byId);
  const loading = useProjectsStore((s) => s.loading);
  const allFetched = useProjectsStore((s) => s.allFetched);
  const error = useProjectsStore((s) => s.error);
  const fetchAll = useProjectsStore((s) => s.fetchAll);
  const upsert = useProjectsStore((s) => s.upsert);
  const removeFromCache = useProjectsStore((s) => s.removeFromCache);

  const projects = useMemo(() => Object.values(byId), [byId]);

  useEffect(() => {
    if (isAuth && !allFetched) fetchAll();
  }, [isAuth, allFetched, fetchAll]);

  const refetch = useCallback(() => fetchAll(), [fetchAll]);

  const create = useCallback(
    async (input: CreateProjectInput) => {
      const project = await projectsApi.create(input);
      upsert(project);
      return project;
    },
    [upsert],
  );

  const update = useCallback(
    async (id: string, input: UpdateProjectInput) => {
      const project = await projectsApi.update(id, input);
      upsert(project);
      return project;
    },
    [upsert],
  );

  const remove = useCallback(
    async (id: string) => {
      await projectsApi.remove(id);
      removeFromCache(id);
    },
    [removeFromCache],
  );

  return { projects, loading, error, refetch, create, update, remove };
}

export function useProject(id: string | null | undefined) {
  const project = useProjectsStore((s) => (id ? s.byId[id] ?? null : null));
  const fetchOne = useProjectsStore((s) => s.fetchOne);
  const [loading, setLoading] = useState(!project && !!id);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchOne(id)
      .then((p) => {
        if (cancelled) return;
        if (!p) setError(new Error("Projet introuvable"));
      })
      .catch((e) => {
        if (!cancelled) setError(e as Error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, fetchOne]);

  return { project, loading, error };
}

// Permet aux autres modules (auth provider sur logout) de reset le cache.
export const projectsStoreApi = useProjectsStore;
