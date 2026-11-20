import { apiClient } from "../core";
import { holidaysEndpoints } from "./holidays.endpoints";
import type { Holiday } from "./holidays.types";

/** Réponse brute de l'API publique Nager.Date. */
interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

/**
 * Nager.Date renvoie les libellés en anglais pour Madagascar. On les traduit
 * en français ; tout libellé non couvert retombe sur `localName`.
 */
const MG_HOLIDAY_FR: Record<string, string> = {
  "New Year's Day": "Jour de l'an",
  "Martyrs' Day": "Fête des Martyrs",
  "Easter Sunday": "Pâques",
  "Easter Monday": "Lundi de Pâques",
  "Labour Day": "Fête du Travail",
  "Ascension Day": "Ascension",
  "Whit Sunday": "Pentecôte",
  "Whit Monday": "Lundi de Pentecôte",
  "Independence Day": "Fête de l'Indépendance",
  "Assumption Day": "Assomption",
  "All Saints' Day": "Toussaint",
  "Christmas Day": "Noël",
  "Women's Day": "Journée de la femme",
};

export const holidaysApi = {
  /**
   * Jours fériés d'une année pour un pays donné (Madagascar par défaut).
   * Appel non authentifié vers l'API publique Nager.Date.
   */
  list: async (year: number, countryCode = "MG"): Promise<Holiday[]> => {
    const data = await apiClient.get<NagerHoliday[]>(
      holidaysEndpoints.publicHolidays(year, countryCode),
      { auth: false },
    );
    return data.map((h) => ({
      date: h.date,
      name: MG_HOLIDAY_FR[h.name] ?? h.localName ?? h.name,
      localName: h.localName,
      countryCode: h.countryCode,
    }));
  },
};
