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

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now > value.expiresAt) {
      store.delete(key);
    }
  }
}, 60_000);

module.exports = { set, get, delete: del };
