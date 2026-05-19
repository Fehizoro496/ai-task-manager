import type { AppearancePrefs } from "@/services";

const DEFAULT: AppearancePrefs = {
  theme: "clair",
  accent: "#6366F1",
  density: "standard",
};

/** Convertit `#RRGGBB` (ou `#RGB`) en composantes HSL [0-360, 0-100, 0-100]. */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
  const norm =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(norm)) {
    return { h: 239, s: 84, l: 67 }; // brand par défaut
  }
  let r = parseInt(norm.slice(0, 2), 16) / 255;
  let g = parseInt(norm.slice(2, 4), 16) / 255;
  let b = parseInt(norm.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / delta + 2) * 60;
    else h = ((r - g) / delta + 4) * 60;
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Applique les préférences d'apparence au document. Idempotent — peut
 * être appelé à chaque changement sans effet de bord cumulatif.
 */
export function applyAppearance(prefs?: AppearancePrefs | null) {
  if (typeof document === "undefined") return;
  const effective = { ...DEFAULT, ...(prefs ?? {}) };
  const root = document.documentElement;

  root.dataset.theme = effective.theme;
  root.dataset.density = effective.density;

  const { h, s, l } = hexToHsl(effective.accent);
  // Brand : 4 variantes dérivées de la même teinte
  root.style.setProperty("--brand", `${h} ${s}% ${l}%`);
  root.style.setProperty(
    "--brand-ink",
    `${h} ${Math.max(s - 14, 30)}% ${Math.max(l - 29, 28)}%`,
  );
  root.style.setProperty("--brand-soft", `${h} 100% 96%`);
  root.style.setProperty("--brand-tint", `${h} 90% 92%`);

  // Cache pour le script de pre-hydration (anti-flash au reload)
  try {
    window.sessionStorage.setItem("appearance", JSON.stringify(effective));
  } catch {
    /* ignore */
  }
}

/** Reset des overrides — utile au logout pour repartir des valeurs CSS. */
export function resetAppearance() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  delete root.dataset.theme;
  delete root.dataset.density;
  root.style.removeProperty("--brand");
  root.style.removeProperty("--brand-ink");
  root.style.removeProperty("--brand-soft");
  root.style.removeProperty("--brand-tint");
  try {
    window.sessionStorage.removeItem("appearance");
  } catch {
    /* ignore */
  }
}
