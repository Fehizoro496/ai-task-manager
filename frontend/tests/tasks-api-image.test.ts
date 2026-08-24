import { describe, it, expect, beforeEach, vi } from "vitest";
import { tasksApi } from "@/services/api/tasks.api";
import { tokenStorage } from "@/services/api/client";

const ok = () =>
  new Response(JSON.stringify({ id: "t1" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

const stubFetch = () => {
  const fetchMock = vi.fn<typeof fetch>(async () => ok());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("tasksApi.uploadImage", () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it("envoie l'image en multipart sous la clé « image »", async () => {
    const fetchMock = stubFetch();
    const file = new File(["img"], "capture.png", { type: "image/png" });

    await tasksApi.uploadImage("t1", file);

    const [url, init] = fetchMock.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe("/api/tasks/t1/image");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    const form = init?.body as FormData;
    expect(form.get("image")).toBeInstanceOf(File);
    expect((form.get("image") as File).name).toBe("capture.png");
    // Pas de Content-Type manuel : le boundary multipart est posé par le runtime.
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
  });

  it("joint le jeton d'authentification", async () => {
    const fetchMock = stubFetch();
    tokenStorage.set("jeton-test");
    const file = new File(["img"], "capture.png", { type: "image/png" });

    await tasksApi.uploadImage("t1", file);

    const init = fetchMock.mock.calls[0][1];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer jeton-test");
  });
});

describe("tasksApi.removeImage", () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it("appelle DELETE sur la route de l'image", async () => {
    const fetchMock = stubFetch();
    await tasksApi.removeImage("t1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe("/api/tasks/t1/image");
    expect(init?.method).toBe("DELETE");
  });
});
