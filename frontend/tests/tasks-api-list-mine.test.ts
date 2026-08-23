import { describe, it, expect, beforeEach, vi } from "vitest";
import { tasksApi } from "@/services/api/tasks.api";
import { tokenStorage } from "@/services/api/client";

const pageVide = () =>
  new Response(JSON.stringify({ tasks: [], total: 0, limit: 30, offset: 0, hasMore: false }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

const stubFetch = () => {
  const fetchMock = vi.fn<typeof fetch>(async () => pageVide());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

/**
 * Vérifie l'URL réellement appelée : les filtres de « Mes tâches » voyagent en
 * query string, et une valeur mal sérialisée passerait inaperçue côté client
 * tout en cassant le filtrage serveur.
 */
/** Installe le stub et rend un accesseur vers l'URL du premier appel. */
const captureUrl = () => {
  const fetchMock = stubFetch();
  return () => new URL(String(fetchMock.mock.calls[0][0]));
};

describe("tasksApi.listMine", () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it("cible l'endpoint dédié", async () => {
    const url = captureUrl();
    await tasksApi.listMine({});
    expect(url().pathname).toBe("/api/tasks/my");
  });

  it("transmet la pagination et le tri", async () => {
    const url = captureUrl();
    await tasksApi.listMine({ scope: "active", sort: "priority", limit: 30, offset: 60 });

    const params = url().searchParams;
    expect(params.get("scope")).toBe("active");
    expect(params.get("sort")).toBe("priority");
    expect(params.get("limit")).toBe("30");
    expect(params.get("offset")).toBe("60");
  });

  it("sérialise les listes de filtres en CSV", async () => {
    const url = captureUrl();
    await tasksApi.listMine({
      priorities: ["urgent", "high"],
      projectIds: ["p1", "p2"],
    });

    const params = url().searchParams;
    expect(params.get("priority")).toBe("urgent,high");
    expect(params.get("projectId")).toBe("p1,p2");
  });

  it("omet les listes vides plutôt que d'envoyer un paramètre vide", async () => {
    const url = captureUrl();
    await tasksApi.listMine({ priorities: [], projectIds: [] });

    const params = url().searchParams;
    expect(params.has("priority")).toBe(false);
    expect(params.has("projectId")).toBe(false);
  });

  it("nettoie la recherche et l'omet si elle ne contient que des espaces", async () => {
    const url = captureUrl();
    await tasksApi.listMine({ q: "  login  " });
    expect(url().searchParams.get("q")).toBe("login");

    const vide = captureUrl();
    await tasksApi.listMine({ q: "   " });
    expect(vide().searchParams.has("q")).toBe(false);
  });

  it("joint le jeton d'authentification", async () => {
    const fetchMock = stubFetch();
    tokenStorage.set("jeton-test");

    await tasksApi.listMine({});

    const init = fetchMock.mock.calls[0][1];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer jeton-test");
  });

  it("remonte la page telle que renvoyée par le serveur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        async () =>
          new Response(
            JSON.stringify({
              tasks: [{ id: "t1" }],
              total: 42,
              limit: 30,
              offset: 0,
              hasMore: true,
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    );

    const page = await tasksApi.listMine({});
    expect(page.total).toBe(42);
    expect(page.hasMore).toBe(true);
    expect(page.tasks).toHaveLength(1);
  });
});
