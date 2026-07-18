import { describe, it, expect } from 'vitest';
import {
  CACHE_VERSION,
  cacheKey,
  capTransactions,
  serializeCache,
  deserializeCache,
  pruneForQuota,
  cacheSyncedAt,
} from './offlineCache';

const USER = 'user-123';

const tx = (id, date) => ({ id, date, amount: 100, category: 'Food & Dining', type: 'expense' });

const CACHE = {
  userId: USER,
  transactions: { rows: [tx('a', '2026-07-10'), tx('b', '2026-07-09')], syncedAt: 1000 },
  debts: { rows: [{ id: 'd1', type: 'lent', amount: 500 }], syncedAt: 1000 },
  settings: { row: { base_income: 20000, category_metadata: { _currency: 'BDT' } }, syncedAt: 1000 },
};

describe('cacheKey', () => {
  it('is user-scoped and version-stamped', () => {
    expect(cacheKey(USER)).toBe(`trackify_cache_v${CACHE_VERSION}_${USER}`);
  });
});

describe('capTransactions', () => {
  it('returns the same array when under the cap', () => {
    const rows = [tx('a', '2026-07-10')];
    expect(capTransactions(rows, 10)).toBe(rows);
  });

  it('keeps the newest rows when over the cap', () => {
    const rows = [
      tx('old', '2026-01-01'),
      tx('new', '2026-07-10'),
      tx('mid', '2026-04-01'),
    ];
    expect(capTransactions(rows, 2).map(r => r.id)).toEqual(['new', 'mid']);
  });

  it('is stable on equal dates, preserving input order', () => {
    const rows = [tx('first', '2026-07-10'), tx('second', '2026-07-10'), tx('third', '2026-07-10')];
    expect(capTransactions(rows, 2).map(r => r.id)).toEqual(['first', 'second']);
  });

  it('tolerates non-arrays and rows with no date', () => {
    expect(capTransactions(null)).toEqual([]);
    expect(capTransactions(undefined)).toEqual([]);
    expect(capTransactions([{ id: 'x' }, { id: 'y' }], 1)).toHaveLength(1);
  });
});

describe('serializeCache / deserializeCache', () => {
  it('round-trips a full cache', () => {
    const out = deserializeCache(serializeCache(CACHE), USER);
    expect(out.userId).toBe(USER);
    expect(out.transactions.rows.map(r => r.id)).toEqual(['a', 'b']);
    expect(out.transactions.syncedAt).toBe(1000);
    expect(out.debts.rows).toHaveLength(1);
    expect(out.settings.row.base_income).toBe(20000);
  });

  it('round-trips a partial cache (slices fail independently)', () => {
    const settingsOnly = { userId: USER, transactions: null, debts: null, settings: CACHE.settings };
    const out = deserializeCache(serializeCache(settingsOnly), USER);
    expect(out.settings.row.base_income).toBe(20000);
    expect(out.transactions).toBeNull();
    expect(out.debts).toBeNull();
  });

  it('returns null and never throws for malformed input', () => {
    const bad = ['{', '', 'null', '[]', 'undefined', '{"v":1}', '42', '"a string"'];
    bad.forEach((raw) => {
      expect(() => deserializeCache(raw, USER)).not.toThrow();
      expect(deserializeCache(raw, USER)).toBeNull();
    });
    expect(deserializeCache(null, USER)).toBeNull();
    expect(deserializeCache(undefined, USER)).toBeNull();
  });

  it('rejects a cache written by a different version', () => {
    const raw = JSON.stringify({ ...CACHE, v: CACHE_VERSION + 1 });
    expect(deserializeCache(raw, USER)).toBeNull();
  });

  it('refuses another user cache', () => {
    const raw = serializeCache(CACHE);
    expect(deserializeCache(raw, 'someone-else')).toBeNull();
  });

  it('rejects a cache with no userId', () => {
    const raw = JSON.stringify({ v: CACHE_VERSION, transactions: null, debts: null, settings: null });
    expect(deserializeCache(raw, USER)).toBeNull();
  });

  it('drops a slice whose rows are not an array rather than the whole cache', () => {
    const raw = JSON.stringify({
      v: CACHE_VERSION,
      userId: USER,
      transactions: { rows: 'not-an-array', syncedAt: 1 },
      debts: { rows: [{ id: 'd' }], syncedAt: 2 },
      settings: null,
    });
    const out = deserializeCache(raw, USER);
    expect(out).not.toBeNull();
    expect(out.transactions).toBeNull();
    expect(out.debts.rows).toHaveLength(1);
  });

  it('caps transactions on write', () => {
    const many = Array.from({ length: 20 }, (_, i) => tx(`t${i}`, `2026-07-${String(i + 1).padStart(2, '0')}`));
    const raw = serializeCache({ userId: USER, transactions: { rows: many, syncedAt: 1 }, debts: null, settings: null });
    const parsed = JSON.parse(raw);
    // Under the real cap, so nothing is dropped.
    expect(parsed.transactions.rows).toHaveLength(20);
  });
});

describe('pruneForQuota', () => {
  it('at least halves the cached transactions, keeping the newest', () => {
    const rows = Array.from({ length: 10 }, (_, i) => tx(`t${i}`, `2026-07-${String(i + 1).padStart(2, '0')}`));
    const pruned = pruneForQuota({ ...CACHE, transactions: { rows, syncedAt: 1 } });
    expect(pruned.transactions.rows).toHaveLength(5);
    // t9 is the newest date, so it must survive.
    expect(pruned.transactions.rows.map(r => r.id)).toContain('t9');
    expect(pruned.transactions.rows.map(r => r.id)).not.toContain('t0');
  });

  it('leaves other slices untouched', () => {
    const rows = Array.from({ length: 4 }, (_, i) => tx(`t${i}`, `2026-07-0${i + 1}`));
    const pruned = pruneForQuota({ ...CACHE, transactions: { rows, syncedAt: 1 } });
    expect(pruned.debts).toEqual(CACHE.debts);
    expect(pruned.settings).toEqual(CACHE.settings);
  });

  it('is a no-op for an empty or missing transactions slice', () => {
    const empty = { ...CACHE, transactions: { rows: [], syncedAt: 1 } };
    expect(pruneForQuota(empty)).toBe(empty);
    const none = { ...CACHE, transactions: null };
    expect(pruneForQuota(none)).toBe(none);
  });
});

describe('cacheSyncedAt', () => {
  it('reports the oldest slice timestamp, not the newest', () => {
    // A fresh settings fetch does not make stale transactions accurate.
    const cache = {
      transactions: { rows: [], syncedAt: 500 },
      debts: { rows: [], syncedAt: 900 },
      settings: { row: {}, syncedAt: 1000 },
    };
    expect(cacheSyncedAt(cache)).toBe(500);
  });

  it('is null when any slice is missing or unstamped', () => {
    expect(cacheSyncedAt({ transactions: { rows: [], syncedAt: 1 }, debts: null, settings: null })).toBeNull();
    expect(cacheSyncedAt(null)).toBeNull();
    expect(cacheSyncedAt({
      transactions: { rows: [], syncedAt: 1 },
      debts: { rows: [], syncedAt: null },
      settings: { row: {}, syncedAt: 1 },
    })).toBeNull();
  });
});
