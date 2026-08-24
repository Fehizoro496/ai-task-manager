import { describe, it, expect, beforeEach, vi } from "vitest";
import { aiApi } from "@/services/api/ai.api";
import { tokenStorage } from "@/services/api/client";

const ok = () =>
  new Response(JSON.stringify({ id: "d1", plan: { tasks: [] } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

const stubFetch = () => {
  const fetchMock = vi.fn<typeof fetch>(async () => ok());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("aiApi.updateDraftPlan", () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it("envoie un PATCH avec le plan encapsulé", async () => {
    const fetchMock = stubFetch();
    const plan = { tasks: [{ title: "Nouvelle tâche" }] };

    await aiApi.updateDraftPlan("d1", plan);

    const [url, init] = fetchMock.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe("/api/ai/drafts/d1");
    expect(init?.method).toBe("PATCH");
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
    expect(init?.body).toBe(JSON.stringify({ plan }));
  });

  it("joint le jeton d'authentification", async () => {
    const fetchMock = stubFetch();
    tokenStorage.set("jeton-test");

    await aiApi.updateDraftPlan("d1", { tasks: [] });

    const init = fetchMock.mock.calls[0][1];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer jeton-test");
  });
});
