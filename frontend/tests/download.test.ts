import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { downloadFile } from "@/lib/download";

interface Clic {
  href: string | null;
  download: string | null;
  rel: string;
}

let clics: Clic[];
let createObjectURL: ReturnType<typeof vi.fn>;
let revokeObjectURL: ReturnType<typeof vi.fn>;

beforeEach(() => {
  clics = [];
  // Capture chaque déclenchement de téléchargement sans naviguer réellement.
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clics.push({
      href: this.getAttribute("href"),
      download: this.getAttribute("download"),
      rel: this.rel,
    });
  });

  createObjectURL = vi.fn(() => "blob:mock-url");
  revokeObjectURL = vi.fn();
  (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;
  (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeObjectURL;
});

afterEach(() => {
  vi.useRealTimers();
});

const okResponse = () =>
  new Response(new Blob(["contenu"], { type: "text/plain" }), { status: 200 });

describe("downloadFile", () => {
  it("télécharge via une URL blob quand la requête aboutit", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => okResponse()));

    await downloadFile("https://api.test/uploads/chat/a.txt", "rapport.txt");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clics).toHaveLength(1);
    expect(clics[0].href).toBe("blob:mock-url");
    expect(clics[0].download).toBe("rapport.txt");
    expect(clics[0].rel).toBe("noopener");
  });

  it("récupère la ressource sans envoyer les cookies", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await downloadFile("https://api.test/f.txt");

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: "omit" });
  });

  it("révoque l'URL blob après un délai", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => okResponse()));

    await downloadFile("https://api.test/f.txt");
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("bascule sur la navigation directe si la réponse est en erreur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response("nope", { status: 404 })),
    );

    await downloadFile("https://api.test/manquant.txt", "x.txt");

    expect(createObjectURL).not.toHaveBeenCalled();
    expect(clics).toHaveLength(1);
    expect(clics[0].href).toBe("https://api.test/manquant.txt");
    expect(clics[0].download).toBe("x.txt");
  });

  it("bascule sur la navigation directe si fetch échoue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => {
        throw new Error("réseau coupé");
      }),
    );

    await downloadFile("https://api.test/f.txt");

    expect(createObjectURL).not.toHaveBeenCalled();
    expect(clics).toHaveLength(1);
    expect(clics[0].href).toBe("https://api.test/f.txt");
  });
});
