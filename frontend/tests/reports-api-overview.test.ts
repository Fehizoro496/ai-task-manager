import { describe, it, expect, beforeEach, vi } from "vitest";
import { reportsApi } from "@/services/api/reports.api";
import { tokenStorage } from "@/services/api/client";

const overviewVide = () =>
  new Response(
    JSON.stringify({
      totals: {},
      byStatus: [],
      byPriority: [],
      byProject: [],
      topAssignees: [],
      completionByDay: [],
      range: { unit: "day", anchor: "2026-08-24", start: "", end: "", label: "" },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

const captureUrl = () => {
  const fetchMock = vi.fn<typeof fetch>(async () => overviewVide());
  vi.stubGlobal("fetch", fetchMock);
  return () => new URL(String(fetchMock.mock.calls[0][0]));
};

describe("reportsApi.overview", () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it("cible l'endpoint des rapports", async () => {
    const url = captureUrl();
    await reportsApi.overview();
    expect(url().pathname).toBe("/api/reports/overview");
  });

  it("transmet l'unité et l'ancre en query", async () => {
    const url = captureUrl();
    await reportsApi.overview({ unit: "week", anchor: "2026-08-24" });

    const params = url().searchParams;
    expect(params.get("unit")).toBe("week");
    expect(params.get("anchor")).toBe("2026-08-24");
  });

  it("omet les paramètres non fournis", async () => {
    const url = captureUrl();
    await reportsApi.overview({ unit: "month" });

    const params = url().searchParams;
    expect(params.get("unit")).toBe("month");
    expect(params.has("anchor")).toBe(false);
  });

  it("n'ajoute aucun paramètre sans requête", async () => {
    const url = captureUrl();
    await reportsApi.overview();
    expect(url().search).toBe("");
  });

  it("joint le jeton d'authentification", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => overviewVide());
    vi.stubGlobal("fetch", fetchMock);
    tokenStorage.set("jeton-test");

    await reportsApi.overview();

    const init = fetchMock.mock.calls[0][1];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer jeton-test");
  });

  it("propage le signal d'annulation", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => overviewVide());
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await reportsApi.overview({ unit: "day" }, controller.signal);

    const init = fetchMock.mock.calls[0][1];
    expect(init?.signal).toBe(controller.signal);
  });
});
