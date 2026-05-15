"use client";
import { useCallback, useEffect, useState } from "react";
import { projectsApi } from "../api/projects.api";
import type { CreateProjectInput, UpdateProjectInput } from "../api/projects.api";
import type { Project } from "../api/types";
import { useAuthStore } from "../auth/auth-store";

export function useProjects() {
  const isAuth = useAuthStore((s) => s.status === "authenticated");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsApi.list();
      setProjects(data);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuth) refetch();
  }, [isAuth, refetch]);

  const create = useCallback(
    async (input: CreateProjectInput) => {
      const project = await projectsApi.create(input);
      setProjects((curr) => [project, ...curr]);
      return project;
    },
    [],
  );

  const update = useCallback(async (id: string, input: UpdateProjectInput) => {
    const project = await projectsApi.update(id, input);
    setProjects((curr) => curr.map((p) => (p.id === id ? project : p)));
    return project;
  }, []);

  const remove = useCallback(async (id: string) => {
    await projectsApi.remove(id);
    setProjects((curr) => curr.filter((p) => p.id !== id));
  }, []);

  return { projects, loading, error, refetch, create, update, remove };
}

export function useProject(id: string | null | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    projectsApi
      .getById(id)
      .then((p) => {
        setProject(p);
        setError(null);
      })
      .catch((e) => setError(e as Error))
      .finally(() => setLoading(false));
  }, [id]);

  return { project, loading, error };
}
