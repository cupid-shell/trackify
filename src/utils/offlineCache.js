// Last-synced snapshot of the user's server data, kept in localStorage so a boot
// without a connection shows real numbers instead of a fake-empty dashboard.
//
// Why localStorage and not IndexedDB: the read has to be SYNCHRONOUS. Hydration
// happens in useState lazy initializers, before first paint — an async IndexedDB
// open would land after the empty frame we're trying to eliminate. At ~230 bytes
// a row, 3,000 transactions is ~700 KB, comfortably inside the ~5 MB budget.
// Revisit IndexedDB past ~8,000 transactions, or if receipts are ever cached.
//
// This cache is DISPOSABLE — it is only ever a copy of what the server already
// has. The pending-write queue is the opposite (unsynced user data), which is
// why the two live under separate keys and the queue is always written first.
//
// The pure functions here are the testable core; the localStorage wrappers at
// the bottom are the thin impure shell.

export const CACHE_VERSION = 1;

// Cap on cached transactions. A guard against unbounded growth, not a limit on
// what the app can hold — the live array is whatever the server returns.
export const MAX_CACHED_TRANSACTIONS = 4000;

export const cacheKey = (userId) => `trackify_cache_v${CACHE_VERSION}_${userId}`;

// Newest-first by date, then keep the first `max`. Sorting is explicit rather
// than trusting the caller's order, and ties keep their original relative order
// so a re-cache of unchanged data produces an identical string.
export const capTransactions = (rows, max = MAX_CACHED_TRANSACTIONS) => {
  if (!Array.isArray(rows)) return [];
  if (rows.length <= max) return rows;
  return rows
    .map((row, i) => ({ row, i }))
    .sort((a, b) => {
      const d = String(b.row?.date || '').localeCompare(String(a.row?.date || ''));
      return d !== 0 ? d : a.i - b.i;
    })
    .slice(0, max)
    .map((x) => x.row);
};

// Build the persisted shape. Slices are independent: the three fetches fail
// independently, so a settings-only or transactions-only cache is valid and
// must survive a round trip.
export const serializeCache = ({ userId, transactions, debts, settings }) =>
  JSON.stringify({
    v: CACHE_VERSION,
    userId,
    transactions: transactions
      ? { rows: capTransactions(transactions.rows), syncedAt: transactions.syncedAt }
      : null,
    debts: debts ? { rows: debts.rows, syncedAt: debts.syncedAt } : null,
    settings: settings ? { row: settings.row, syncedAt: settings.syncedAt } : null,
  });

// Parse a cache blob. Returns null — never throws — for anything unexpected:
// corrupt JSON, an old version, or another user's data. A cache is disposable,
// so the correct response to "I don't fully trust this" is always to discard it.
export const deserializeCache = (raw, expectedUserId) => {
  if (typeof raw !== 'string' || raw.length === 0) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  if (parsed.v !== CACHE_VERSION) return null;
  // Refuse to hand one user another user's numbers, even for a frame.
  if (!parsed.userId || parsed.userId !== expectedUserId) return null;

  const slice = (s, key) => {
    if (!s || typeof s !== 'object') return null;
    if (key === 'rows') return Array.isArray(s.rows) ? { rows: s.rows, syncedAt: s.syncedAt ?? null } : null;
    return s.row && typeof s.row === 'object' ? { row: s.row, syncedAt: s.syncedAt ?? null } : null;
  };

  return {
    v: parsed.v,
    userId: parsed.userId,
    transactions: slice(parsed.transactions, 'rows'),
    debts: slice(parsed.debts, 'rows'),
    settings: slice(parsed.settings, 'row'),
  };
};

// Drop the oldest half of the cached transactions. Used to recover from a
// quota error rather than giving up on caching entirely.
export const pruneForQuota = (cache) => {
  if (!cache?.transactions?.rows?.length) return cache;
  const keep = Math.floor(cache.transactions.rows.length / 2);
  return {
    ...cache,
    transactions: {
      ...cache.transactions,
      rows: capTransactions(cache.transactions.rows, keep),
    },
  };
};

// The most recent point at which we know the whole picture was current: the
// OLDEST of the slice timestamps, since a fresher slice doesn't make a stale
// one accurate. Null if any slice is missing.
export const cacheSyncedAt = (cache) => {
  const stamps = [cache?.transactions?.syncedAt, cache?.debts?.syncedAt, cache?.settings?.syncedAt];
  if (stamps.some((s) => typeof s !== 'number')) return null;
  return Math.min(...stamps);
};

// ---------------------------------------------------------------------------
// Impure localStorage shell. Kept separate so everything above stays testable
// under the plugin-free (node env, no jsdom) vitest config.
// ---------------------------------------------------------------------------

export const readCache = (userId) => {
  if (!userId) return null;
  try {
    return deserializeCache(localStorage.getItem(cacheKey(userId)), userId);
  } catch {
    return null;
  }
};

// Writes the cache, recovering from a full quota by pruning once. Returns
// true on success. A false result means caching is off for now — the app still
// works, it just won't have an offline snapshot.
export const writeCache = (userId, cache) => {
  if (!userId || !cache) return false;
  const key = cacheKey(userId);
  try {
    localStorage.setItem(key, serializeCache({ userId, ...cache }));
    return true;
  } catch {
    try {
      localStorage.setItem(key, serializeCache({ userId, ...pruneForQuota(cache) }));
      return true;
    } catch {
      // Still no room. Leave whatever is already stored rather than clearing it:
      // a stale snapshot beats none.
      return false;
    }
  }
};

export const clearCache = (userId) => {
  if (!userId) return;
  try {
    localStorage.removeItem(cacheKey(userId));
  } catch {
    // Nothing useful to do.
  }
};
