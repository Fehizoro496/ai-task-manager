const NAGER_BASE = "https://date.nager.at/api/v3/PublicHolidays";

/** API publique externe (Nager.Date), hors backend : URLs absolues. */
export const holidaysEndpoints = {
  publicHolidays: (year: number, countryCode: string) =>
    `${NAGER_BASE}/${year}/${countryCode}`,
} as const;
