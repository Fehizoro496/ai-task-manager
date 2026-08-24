import { describe, it, expect, beforeEach, vi } from "vitest";
import { holidaysApi } from "@/services/api/holidays.api";
import { tokenStorage } from "@/services/api/client";

const nagerHoliday = (over: Record<string, unknown> = {}) => ({
  date: "2026-01-01",
  localName: "Taom-baovao",
  name: "New Year's Day",
  countryCode: "MG",
  fixed: true,
  global: true,
  counties: null,
  launchYear: null,
  types: ["Public"],
  ...over,
});

const stubFetch = (body: unknown) => {
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("holidaysApi.list", () => {
  beforeEach(() => {
    tokenStorage.set("ne-doit-pas-servir");
  });

  it("interroge l'API publique Nager.Date sans authentification", async () => {
    const fetchMock = stubFetch([]);
    await holidaysApi.list(2026);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://date.nager.at/api/v3/PublicHolidays/2026/MG");
    // Appel public : aucun en-tête Authorization ne doit fuiter.
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });

  it("honore un code pays explicite", async () => {
    const fetchMock = stubFetch([]);
    await holidaysApi.list(2025, "FR");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/2025/FR");
  });

  it("traduit en français les libellés connus", async () => {
    stubFetch([nagerHoliday({ name: "Independence Day", localName: "Fetim-pirenena" })]);
    const [holiday] = await holidaysApi.list(2026);
    expect(holiday.name).toBe("Fête de l'Indépendance");
    expect(holiday.localName).toBe("Fetim-pirenena");
  });

  it("retombe sur le nom local pour un libellé non traduit", async () => {
    stubFetch([nagerHoliday({ name: "Some Local Feast", localName: "Fetin'ny tanàna" })]);
    const [holiday] = await holidaysApi.list(2026);
    expect(holiday.name).toBe("Fetin'ny tanàna");
  });

  it("retombe sur le nom d'origine quand le nom local est absent", async () => {
    stubFetch([nagerHoliday({ name: "Unmapped", localName: null })]);
    const [holiday] = await holidaysApi.list(2026);
    expect(holiday.name).toBe("Unmapped");
  });

  it("ne conserve que les champs utiles du calendrier", async () => {
    stubFetch([nagerHoliday()]);
    const [holiday] = await holidaysApi.list(2026);
    expect(holiday).toEqual({
      date: "2026-01-01",
      name: "Jour de l'an",
      localName: "Taom-baovao",
      countryCode: "MG",
    });
  });
});
