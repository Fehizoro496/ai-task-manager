import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useMyTasks } from "@/services/hooks/use-my-tasks";
import type { MyTasksFilters } from "@/services/hooks/use-my-tasks";
import type { MyTasksPage } from "@/services/api/tasks.api";
import type { Task } from "@/services/api/types";

vi.mock("@/services/api/tasks.api", () => ({
  tasksApi: { listMine: vi.fn() },
}));

import { tasksApi } from "@/services/api/tasks.api";

const listMine = vi.mocked(tasksApi.listMine);

const baseFilters: MyTasksFilters = {
  scope: "all",
  q: "",
  priorities: [],
  projectIds: [],
  sort: "due_asc",
};

const task = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  identifier: id.toUpperCase(),
  title: `Tâche ${id}`,
  description: null,
  status: "todo",
  priority: "medium",
  position: 0,
  projectId: "projet-1",
  assigneeId: "moi",
  labels: [],
  dueDate: null,
  ...over,
});

const page = (tasks: Task[], over: Partial<MyTasksPage> = {}): MyTasksPage => ({
  tasks,
  total: tasks.length,
  limit: 30,
  offset: 0,
  hasMore: false,
  ...over,
});

/** Promesse dont le test décide du moment de résolution. */
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const ids = (tasks: Task[]) => tasks.map((t) => t.id);

beforeEach(() => {
  listMine.mockReset();
});

describe("useMyTasks — chargement initial", () => {
  it("demande le premier lot avec les filtres actifs", async () => {
    listMine.mockResolvedValue(page([task("t1")], { total: 1 }));

    const { result } = renderHook(() =>
      useMyTasks({
        scope: "active",
        q: "  login  ",
        priorities: ["urgent"],
        projectIds: ["projet-1"],
        sort: "priority",
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(listMine).toHaveBeenCalledTimes(1);
    expect(listMine).toHaveBeenCalledWith({
      scope: "active",
      q: "login",
      priorities: ["urgent"],
      projectIds: ["projet-1"],
      sort: "priority",
      limit: 30,
      offset: 0,
    });
    expect(ids(result.current.tasks)).toEqual(["t1"]);
    expect(result.current.total).toBe(1);
  });

  it("ne relance rien quand les filtres changent de référence mais pas de valeur", async () => {
    listMine.mockResolvedValue(page([task("t1")]));

    const { result, rerender } = renderHook((filters: MyTasksFilters) => useMyTasks(filters), {
      initialProps: { ...baseFilters, priorities: ["urgent"] } as MyTasksFilters,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Nouveaux tableaux, contenu identique : un rechargement serait du gaspillage.
    rerender({ ...baseFilters, priorities: ["urgent"] });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(listMine).toHaveBeenCalledTimes(1);
  });

  it("remonte l'erreur et laisse la liste vide", async () => {
    listMine.mockRejectedValue(new Error("réseau indisponible"));

    const { result } = renderHook(() => useMyTasks(baseFilters));

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.tasks).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.loading).toBe(false);
  });
});

describe("useMyTasks — chargement par lots", () => {
  it("ajoute le lot suivant à la suite du précédent", async () => {
    listMine
      .mockResolvedValueOnce(page([task("t1"), task("t2")], { total: 4, limit: 2, hasMore: true }))
      .mockResolvedValueOnce(
        page([task("t3"), task("t4")], { total: 4, limit: 2, offset: 2, hasMore: false }),
      );

    const { result } = renderHook(() => useMyTasks(baseFilters));
    await waitFor(() => expect(result.current.tasks).toHaveLength(2));
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.tasks).toHaveLength(4));

    expect(listMine).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 2 }));
    expect(ids(result.current.tasks)).toEqual(["t1", "t2", "t3", "t4"]);
    expect(result.current.hasMore).toBe(false);
  });

  it("ne duplique pas une tâche déjà chargée", async () => {
    listMine
      .mockResolvedValueOnce(page([task("t1"), task("t2")], { total: 3, limit: 2, hasMore: true }))
      // La liste a bougé côté serveur : t2 revient dans le lot suivant.
      .mockResolvedValueOnce(
        page([task("t2"), task("t3")], { total: 3, limit: 2, offset: 2, hasMore: false }),
      );

    const { result } = renderHook(() => useMyTasks(baseFilters));
    await waitFor(() => expect(result.current.tasks).toHaveLength(2));

    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.hasMore).toBe(false));

    expect(ids(result.current.tasks)).toEqual(["t1", "t2", "t3"]);
  });

  it("ne demande rien de plus quand la liste est complète", async () => {
    listMine.mockResolvedValue(page([task("t1")], { hasMore: false }));

    const { result } = renderHook(() => useMyTasks(baseFilters));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.loadMore();
    });

    expect(listMine).toHaveBeenCalledTimes(1);
  });

  it("ignore un second appel pendant qu'un lot est déjà en vol", async () => {
    const enVol = deferred<MyTasksPage>();
    listMine
      .mockResolvedValueOnce(page([task("t1")], { total: 3, limit: 1, hasMore: true }))
      .mockReturnValueOnce(enVol.promise);

    const { result } = renderHook(() => useMyTasks(baseFilters));
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));

    await act(async () => {
      result.current.loadMore();
      result.current.loadMore();
      result.current.loadMore();
    });

    expect(listMine).toHaveBeenCalledTimes(2);

    await act(async () => {
      enVol.resolve(page([task("t2")], { total: 3, limit: 1, offset: 1, hasMore: true }));
    });
    await waitFor(() => expect(result.current.tasks).toHaveLength(2));
  });

  it("signale le chargement d'un lot séparément du chargement initial", async () => {
    const enVol = deferred<MyTasksPage>();
    listMine
      .mockResolvedValueOnce(page([task("t1")], { total: 2, limit: 1, hasMore: true }))
      .mockReturnValueOnce(enVol.promise);

    const { result } = renderHook(() => useMyTasks(baseFilters));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.loadingMore).toBe(true));
    expect(result.current.loading).toBe(false);
    // La liste déjà chargée reste affichée pendant que le lot suivant arrive.
    expect(ids(result.current.tasks)).toEqual(["t1"]);

    await act(async () => {
      enVol.resolve(page([task("t2")], { total: 2, limit: 1, offset: 1, hasMore: false }));
    });
    await waitFor(() => expect(result.current.loadingMore).toBe(false));
  });
});

describe("useMyTasks — changement de filtres", () => {
  it("repart du premier lot et remplace la liste", async () => {
    listMine
      .mockResolvedValueOnce(page([task("t1"), task("t2")], { total: 2, limit: 2, hasMore: true }))
      .mockResolvedValueOnce(page([task("t9")], { total: 1 }));

    const { result, rerender } = renderHook((filters: MyTasksFilters) => useMyTasks(filters), {
      initialProps: baseFilters,
    });
    await waitFor(() => expect(result.current.tasks).toHaveLength(2));

    rerender({ ...baseFilters, scope: "done" });
    await waitFor(() => expect(ids(result.current.tasks)).toEqual(["t9"]));

    expect(listMine).toHaveBeenLastCalledWith(
      expect.objectContaining({ scope: "done", offset: 0 }),
    );
    expect(result.current.total).toBe(1);
  });

  it("n'applique pas la réponse d'un filtre abandonné", async () => {
    const lente = deferred<MyTasksPage>();
    listMine
      .mockReturnValueOnce(lente.promise) // filtre initial, réponse tardive
      .mockResolvedValueOnce(page([task("t9")], { total: 1 })); // filtre suivant

    const { result, rerender } = renderHook((filters: MyTasksFilters) => useMyTasks(filters), {
      initialProps: baseFilters,
    });

    rerender({ ...baseFilters, scope: "done" });
    await waitFor(() => expect(ids(result.current.tasks)).toEqual(["t9"]));

    // La première requête finit après coup : sa réponse ne doit rien écraser.
    await act(async () => {
      lente.resolve(page([task("obsolete")], { total: 99 }));
    });

    expect(ids(result.current.tasks)).toEqual(["t9"]);
    expect(result.current.total).toBe(1);
  });

  it("recharge à la demande via refresh", async () => {
    listMine
      .mockResolvedValueOnce(page([task("t1")], { total: 1 }))
      .mockResolvedValueOnce(page([task("t1"), task("t2")], { total: 2 }));

    const { result } = renderHook(() => useMyTasks(baseFilters));
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));

    await act(async () => {
      await result.current.refresh();
    });

    expect(listMine).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 0 }));
    expect(result.current.tasks).toHaveLength(2);
  });
});

describe("useMyTasks — mises à jour locales", () => {
  const monter = async (filters: MyTasksFilters = baseFilters) => {
    listMine.mockResolvedValue(
      page([task("t1"), task("t2", { priority: "urgent" })], { total: 2 }),
    );
    const rendu = renderHook(() => useMyTasks(filters));
    await waitFor(() => expect(rendu.result.current.tasks).toHaveLength(2));
    return rendu;
  };

  it("remplace une tâche modifiée sans recharger", async () => {
    const { result } = await monter();

    act(() => {
      result.current.applyUpdate(task("t1", { title: "Titre corrigé" }));
    });

    expect(result.current.tasks[0].title).toBe("Titre corrigé");
    expect(result.current.tasks).toHaveLength(2);
    expect(listMine).toHaveBeenCalledTimes(1);
  });

  it("retire une tâche devenue terminée quand seules les actives sont affichées", async () => {
    const { result } = await monter({ ...baseFilters, scope: "active" });

    act(() => {
      result.current.applyUpdate(task("t1", { status: "done" }));
    });

    expect(ids(result.current.tasks)).toEqual(["t2"]);
    expect(result.current.total).toBe(1);
  });

  it("retire une tâche qui sort du filtre de priorité", async () => {
    const { result } = await monter({ ...baseFilters, priorities: ["urgent"] });

    act(() => {
      result.current.applyUpdate(task("t2", { priority: "low" }));
    });

    expect(ids(result.current.tasks)).toEqual(["t1"]);
  });

  it("retire une tâche qui sort du filtre de projet", async () => {
    const { result } = await monter({ ...baseFilters, projectIds: ["projet-1"] });

    act(() => {
      result.current.applyUpdate(task("t1", { projectId: "projet-2" }));
    });

    expect(ids(result.current.tasks)).toEqual(["t2"]);
  });

  it("ignore une tâche absente de la liste chargée", async () => {
    const { result } = await monter();

    act(() => {
      result.current.applyUpdate(task("inconnue"));
    });

    expect(ids(result.current.tasks)).toEqual(["t1", "t2"]);
    expect(result.current.total).toBe(2);
  });

  it("retire une tâche supprimée et décrémente le total", async () => {
    const { result } = await monter();

    act(() => {
      result.current.removeLocal("t1");
    });

    expect(ids(result.current.tasks)).toEqual(["t2"]);
    expect(result.current.total).toBe(1);
  });

  it("ne décrémente pas le total pour une suppression hors liste", async () => {
    const { result } = await monter();

    act(() => {
      result.current.removeLocal("inconnue");
    });

    expect(result.current.total).toBe(2);
  });
});
