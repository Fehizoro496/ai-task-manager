export interface Holiday {
  /** Date au format YYYY-MM-DD */
  date: string;
  /** Nom en français (mappé) ou, à défaut, le nom renvoyé par l'API */
  name: string;
  /** Nom local tel que renvoyé par l'API (Nager.Date) */
  localName: string;
  countryCode: string;
}
