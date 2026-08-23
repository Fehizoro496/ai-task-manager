/**
 * In-memory store for OAuth state → result mapping.
 * Entries expire after 5 minutes to prevent memory leaks.
 */
const FIVE_MINUTES_MS = 5 * 60 * 1000;

const store = new Map();

const set = (state, data) => {
  store.set(state, {
    ...data,
    expiresAt: Date.now() + FIVE_MINUTES_MS,
  });
};

const get = (state) => {
  const entry = store.get(state);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(state);
    return null;
  }
  return entry;
};

const del = (state) => {
  store.delete(state);
};

// Cleanup expired entries every minute.
// `unref()` : ce nettoyage best-effort ne doit pas maintenir le process en vie
// à lui seul — sans quoi tout script chargeant l'app (tests, scripts ponctuels)
// ne rendrait jamais la main. Le serveur, lui, a ses propres handles actifs.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now > value.expiresAt) {
      store.delete(key);
    }
  }
}, 60_000);
cleanupTimer.unref();

module.exports = { set, get, delete: del };
