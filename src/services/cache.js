const CACHE_PREFIX = 'fv_cache_';

const TTL = {
  live: 2 * 60 * 1000,         // 2 minutes
  matches: 5 * 60 * 1000,      // 5 minutes
  standings: 15 * 60 * 1000,   // 15 minutes
  scorers: 30 * 60 * 1000,     // 30 minutes
  teams: 60 * 60 * 1000,       // 1 hour
  competitions: 24 * 60 * 60 * 1000, // 24 hours
};

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function cacheSet(key, data, type = 'matches') {
  try {
    const ttl = TTL[type] || TTL.matches;
    const entry = {
      data,
      expiry: Date.now() + ttl,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    // Storage full — clear old entries
    clearExpiredCache();
    try {
      const ttl = TTL[type] || TTL.matches;
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, expiry: Date.now() + ttl }));
    } catch {
      // Ignore
    }
  }
}

export function clearExpiredCache() {
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith(CACHE_PREFIX)) {
      try {
        const { expiry } = JSON.parse(localStorage.getItem(key));
        if (Date.now() > expiry) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  }
}
