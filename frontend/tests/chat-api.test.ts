import { describe, it, expect, beforeEach, vi } from "vitest";
import { chatApi } from "@/services/api/chat.api";
import { tokenStorage } from "@/services/api/client";

const ok = (payload: unknown = { message: { id: "m1" } }) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

const stubFetch = () => {
  const fetchMock = vi.fn<typeof fetch>(async () => ok());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("chatApi.sendMessage", () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it("envoie un message texte en JSON", async () => {
    const fetchMock = stubFetch();
    await chatApi.sendMessage("c1", "Salut");

    const [url, init] = fetchMock.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe("/api/chat/conversations/c1/messages");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
    expect(init?.body).toBe(JSON.stringify({ content: "Salut" }));
  });

  it("bascule en multipart quand des fichiers sont joints", async () => {
    const fetchMock = stubFetch();
    const file = new File(["data"], "photo.png", { type: "image/png" });

    await chatApi.sendMessage("c1", "Regarde", [file]);

    const init = fetchMock.mock.calls[0][1];
    expect(init?.body).toBeInstanceOf(FormData);
    const form = init?.body as FormData;
    expect(form.get("content")).toBe("Regarde");
    expect(form.getAll("files")).toHaveLength(1);
    // Le navigateur pose lui-même le Content-Type multipart (avec boundary).
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
  });

  it("joint plusieurs fichiers sous la clé « files »", async () => {
    const fetchMock = stubFetch();
    const files = [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.pdf", { type: "application/pdf" }),
    ];

    await chatApi.sendMessage("c1", "", files);

    const form = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(form.getAll("files")).toHaveLength(2);
  });

  it("reste en JSON avec un tableau de fichiers vide", async () => {
    const fetchMock = stubFetch();
    await chatApi.sendMessage("c1", "Sans fichier", []);

    const init = fetchMock.mock.calls[0][1];
    expect(init?.body).toBe(JSON.stringify({ content: "Sans fichier" }));
  });
});

describe("chatApi.deleteMessage", () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it("appelle DELETE sur la route du message", async () => {
    const fetchMock = stubFetch();
    await chatApi.deleteMessage("m42");

    const [url, init] = fetchMock.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe("/api/chat/messages/m42");
    expect(init?.method).toBe("DELETE");
  });
});
