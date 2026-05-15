"use client";
import { useCallback, useEffect, useState } from "react";
import { projectsApi } from "../api/projects.api";
import { tasksApi } from "../api/tasks.api";
import type { MoveTaskInput, UpdateTaskInput } from "../api/tasks.api";
import type { Task } from "../api/types";

export function useProjectTasks(projectId: string | null | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await projectsApi.listTasks(projectId);
      setTasks(data.tasks ?? []);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) refetch();
    else setLoading(false);
  }, [projectId, refetch]);

  // Optimistic move: applique le nouveau statut immédiatement, rollback
  // en cas d'erreur API. Évite le flash entre drop et confirmation serveur.
  const move = useCallback(async (id: string, input: MoveTaskInput) => {
    let previous: Task | undefined;
    setTasks((curr) => {
      previous = curr.find((t) => t.id === id);
      return curr.map((t) =>
        t.id === id ? { ...t, status: input.status } : t,
      );
    });

    try {
      const updated = await tasksApi.move(id, input);
      setTasks((curr) => curr.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err) {
      if (previous) {
        const prev = previous;
        setTasks((curr) => curr.map((t) => (t.id === id ? prev : t)));
      }
      throw err;
    }
  }, []);

  const update = useCallback(async (id: string, input: UpdateTaskInput) => {
    const updated = await tasksApi.update(id, input);
    setTasks((curr) => curr.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await tasksApi.remove(id);
    setTasks((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const create = useCallback(
    async (input: { title: string; description?: string; storyId?: string }) => {
      if (!projectId) throw new Error("Pas de projectId");
      const task = await projectsApi.createTask(projectId, input);
      setTasks((curr) => [...curr, task]);
      return task;
    },
    [projectId],
  );

  return { tasks, loading, error, refetch, move, update, remove, create };
}

export function useTask(id: string | null | undefined) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const t = await tasksApi.getById(id);
      setTask(t);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) refetch();
    else setLoading(false);
  }, [id, refetch]);

  return { task, loading, error, refetch, setTask };
}
