// Helpers pour valider / fusionner les préférences utilisateur.

const APPEARANCE_THEMES = ["clair", "sombre", "systeme"];
const DENSITIES = ["compact", "standard", "confort"];
const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const DEFAULT_PREFERENCES = {
  appearance: {
    theme: "clair",
    accent: "#6366F1",
    density: "standard",
  },
  notifications: {
    dailyDigest: true,
    push: false,
    weekendQuiet: true,
    sounds: false,
  },
};

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * Filtre profondément le patch reçu pour n'autoriser que les clés et types
 * connus, avant fusion avec l'existant. Tout ce qui n'est pas reconnu est
 * silencieusement ignoré (no-op safety).
 */
const sanitizePatch = (patch) => {
  if (!isPlainObject(patch)) return {};
  const out = {};

  if (isPlainObject(patch.appearance)) {
    const a = {};
    if (APPEARANCE_THEMES.includes(patch.appearance.theme)) {
      a.theme = patch.appearance.theme;
    }
    if (
      typeof patch.appearance.accent === "string" &&
      HEX_COLOR.test(patch.appearance.accent)
    ) {
      a.accent = patch.appearance.accent;
    }
    if (DENSITIES.includes(patch.appearance.density)) {
      a.density = patch.appearance.density;
    }
    if (Object.keys(a).length > 0) out.appearance = a;
  }

  if (isPlainObject(patch.notifications)) {
    const n = {};
    for (const key of ["dailyDigest", "push", "weekendQuiet", "sounds"]) {
      if (typeof patch.notifications[key] === "boolean") {
        n[key] = patch.notifications[key];
      }
    }
    if (Object.keys(n).length > 0) out.notifications = n;
  }

  return out;
};

/**
 * Fusionne (deep, 2 niveaux) les préférences actuelles avec un patch déjà
 * sanitizé. Renvoie l'objet complet à persister.
 */
const mergePreferences = (current, patch) => {
  const base = isPlainObject(current) ? current : {};
  const next = { ...DEFAULT_PREFERENCES, ...base };
  if (patch.appearance) {
    next.appearance = { ...(next.appearance ?? {}), ...patch.appearance };
  }
  if (patch.notifications) {
    next.notifications = {
      ...(next.notifications ?? {}),
      ...patch.notifications,
    };
  }
  return next;
};

const withDefaults = (current) =>
  mergePreferences(current, {});

module.exports = {
  DEFAULT_PREFERENCES,
  sanitizePatch,
  mergePreferences,
  withDefaults,
};
