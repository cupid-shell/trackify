import { describe, it, expect } from 'vitest';
import {
  QUEUE_VERSION,
  MAX_ATTEMPTS,
  MAX_QUEUE,
  MAX_BACKOFF_MS,
  queueKey,
  backoffDelayMs,
  nextAttemptAt,
  createPendingItem,
  emptyQueue,
  enqueue,
  enqueueMany,
  dequeue,
  markAttempt,
  markFailed,
  resetItem,
  dueItems,
  pendingCount,
  failedCount,
  toOptimisticRow,
  mergeServerWithPending,
  serializeQueue,
  deserializeQueue,
} from './offlineQueue';

const USER = 'user-123';
const NOW = 1_700_000_000_000;

const PAYLOAD = {
  user_id: USER,
  type: 'expense',
  amount: 250,
  category: 'Food & Dining',
  date: '2026-07-15',
  note: 'Lunch',
  payment_method: 'Cash',
  debt_id: null,
};

const item = (id, now = NOW) => createPendingItem({ payload: PAYLOAD, now, id });

describe('queueKey', () => {
  it('is user-scoped', () => {
    expect(queueKey(USER)).toBe(`trackify_pending_tx_${USER}`);
  });
});

describe('createPendingItem', () => {
  it('uses the caller-supplied id and clock, and starts due immediately', () => {
    const i = createPendingItem({ payload: PAYLOAD, now: NOW, id: 'uuid-1' });
    expect(i.id).toBe('uuid-1');
    expect(i.createdAt).toBe(NOW);
    expect(i.nextAttemptAt).toBe(NOW);
    expect(i.attempts).toBe(0);
    expect(i.state).toBe('pending');
    expect(i.lastError).toBeNull();
    expect(i.payload).toBe(PAYLOAD);
  });

  it('carries batch position so a multi-row form submit keeps its ordering', () => {
    const i = createPendingItem({ payload: PAYLOAD, now: NOW, id: 'x', batchId: 'b1', batchIndex: 2 });
    expect(i.batchId).toBe('b1');
    expect(i.batchIndex).toBe(2);
  });
});

describe('enqueue', () => {
  it('appends without mutating the input queue', () => {
    const q = emptyQueue(USER);
    const next = enqueue(q, item('a'));
    expect(q.items).toHaveLength(0); // original untouched
    expect(next.items).toHaveLength(1);
    expect(next).not.toBe(q);
  });

  it('refuses to grow past MAX_QUEUE, returning the queue unchanged', () => {
    const full = { ...emptyQueue(USER), items: Array.from({ length: MAX_QUEUE }, (_, i) => item(`i${i}`)) };
    const next = enqueue(full, item('overflow'));
    expect(next).toBe(full);
    expect(next.items).toHaveLength(MAX_QUEUE);
  });

  it('enqueueMany only takes what fits', () => {
    const nearlyFull = { ...emptyQueue(USER), items: Array.from({ length: MAX_QUEUE - 2 }, (_, i) => item(`i${i}`)) };
    const next = enqueueMany(nearlyFull, [item('a'), item('b'), item('c')]);
    expect(next.items).toHaveLength(MAX_QUEUE);
  });
});

describe('dequeue', () => {
  it('removes the item', () => {
    const q = enqueue(enqueue(emptyQueue(USER), item('a')), item('b'));
    expect(dequeue(q, 'a').items.map(i => i.id)).toEqual(['b']);
  });

  it('returns the SAME reference for an unknown id', () => {
    const q = enqueue(emptyQueue(USER), item('a'));
    expect(dequeue(q, 'nope')).toBe(q);
  });
});

describe('backoffDelayMs', () => {
  it('is sane for the first attempts', () => {
    expect(backoffDelayMs(0)).toBe(2000);
    expect(backoffDelayMs(1)).toBe(2000);
    expect(backoffDelayMs(2)).toBe(4000);
    expect(backoffDelayMs(3)).toBe(8000);
  });

  it('is monotonically non-decreasing and capped at MAX_BACKOFF_MS', () => {
    let prev = 0;
    for (let a = 1; a <= 30; a++) {
      const d = backoffDelayMs(a);
      expect(d).toBeGreaterThanOrEqual(prev);
      expect(d).toBeLessThanOrEqual(MAX_BACKOFF_MS);
      prev = d;
    }
    expect(backoffDelayMs(30)).toBe(MAX_BACKOFF_MS);
  });
});

describe('nextAttemptAt jitter', () => {
  it('spans 75%..125% of the base delay at the rand bounds', () => {
    expect(nextAttemptAt(2, NOW, 0)).toBe(NOW + 4000 * 0.75);
    expect(nextAttemptAt(2, NOW, 1)).toBe(NOW + 4000 * 1.25);
    const mid = nextAttemptAt(2, NOW, 0.5);
    expect(mid).toBeGreaterThan(NOW + 4000 * 0.75);
    expect(mid).toBeLessThan(NOW + 4000 * 1.25);
  });
});

describe('markAttempt', () => {
  it('increments, timestamps, records the error and schedules a retry', () => {
    const q = enqueue(emptyQueue(USER), item('a'));
    const next = markAttempt(q, 'a', { now: NOW, error: 'boom', rand: 0.5 });
    const i = next.items[0];
    expect(i.attempts).toBe(1);
    expect(i.lastAttemptAt).toBe(NOW);
    expect(i.lastError).toBe('boom');
    expect(i.state).toBe('pending');
    expect(i.nextAttemptAt).toBeGreaterThan(NOW);
  });

  it('does not mutate the previous queue or item', () => {
    const q = enqueue(emptyQueue(USER), item('a'));
    const before = { ...q.items[0] };
    markAttempt(q, 'a', { now: NOW });
    expect(q.items[0]).toEqual(before);
  });

  it('flips to failed at the attempt ceiling and stops scheduling', () => {
    let q = enqueue(emptyQueue(USER), item('a'));
    for (let n = 0; n < MAX_ATTEMPTS; n++) {
      q = markAttempt(q, 'a', { now: NOW + n, error: 'net' });
    }
    const i = q.items[0];
    expect(i.attempts).toBe(MAX_ATTEMPTS);
    expect(i.state).toBe('failed');
    expect(i.nextAttemptAt).toBeNull();
  });

  it('never removes the item — unsynced data is not dropped silently', () => {
    let q = enqueue(emptyQueue(USER), item('a'));
    for (let n = 0; n < MAX_ATTEMPTS + 5; n++) {
      q = markAttempt(q, 'a', { now: NOW + n });
    }
    expect(q.items).toHaveLength(1);
  });

  it('returns the same reference for an unknown id', () => {
    const q = enqueue(emptyQueue(USER), item('a'));
    expect(markAttempt(q, 'nope', { now: NOW })).toBe(q);
  });
});

describe('markFailed / resetItem', () => {
  it('markFailed skips straight to failed without burning attempts', () => {
    const q = enqueue(emptyQueue(USER), item('a'));
    const i = markFailed(q, 'a', 'permission denied').items[0];
    expect(i.state).toBe('failed');
    expect(i.attempts).toBe(0);
    expect(i.nextAttemptAt).toBeNull();
    expect(i.lastError).toBe('permission denied');
  });

  it('resetItem clears history and makes it due now', () => {
    let q = enqueue(emptyQueue(USER), item('a'));
    q = markFailed(q, 'a', 'nope');
    const i = resetItem(q, 'a', NOW + 999).items[0];
    expect(i.state).toBe('pending');
    expect(i.attempts).toBe(0);
    expect(i.lastError).toBeNull();
    expect(i.nextAttemptAt).toBe(NOW + 999);
  });
});

describe('dueItems', () => {
  it('returns pending items whose time has come, oldest first', () => {
    const q = {
      ...emptyQueue(USER),
      items: [item('newer', NOW + 1000), item('older', NOW)],
    };
    expect(dueItems(q, NOW + 2000).map(i => i.id)).toEqual(['older', 'newer']);
  });

  it('excludes items scheduled for the future', () => {
    let q = enqueue(emptyQueue(USER), item('a'));
    q = markAttempt(q, 'a', { now: NOW, rand: 0.5 });
    expect(dueItems(q, NOW)).toHaveLength(0);
    expect(dueItems(q, NOW + MAX_BACKOFF_MS)).toHaveLength(1);
  });

  it('excludes failed items', () => {
    let q = enqueue(emptyQueue(USER), item('a'));
    q = markFailed(q, 'a');
    expect(dueItems(q, NOW + 10_000_000)).toHaveLength(0);
  });

  // A backwards clock jump would otherwise park items in the far future and
  // stall the queue permanently, with no error surfaced anywhere.
  it('treats an impossibly-far-future schedule as due (clock skew)', () => {
    const skewed = {
      ...emptyQueue(USER),
      items: [{ ...item('a'), nextAttemptAt: NOW + MAX_BACKOFF_MS * 100 }],
    };
    expect(dueItems(skewed, NOW).map(i => i.id)).toEqual(['a']);
  });

  it('treats a missing schedule as due', () => {
    const q = { ...emptyQueue(USER), items: [{ ...item('a'), nextAttemptAt: undefined }] };
    expect(dueItems(q, NOW)).toHaveLength(1);
  });

  it('does not mutate or reorder the source array', () => {
    const q = { ...emptyQueue(USER), items: [item('b', NOW + 5), item('a', NOW)] };
    dueItems(q, NOW + 100);
    expect(q.items.map(i => i.id)).toEqual(['b', 'a']);
  });
});

describe('counts', () => {
  it('separates pending from failed', () => {
    let q = enqueueMany(emptyQueue(USER), [item('a'), item('b'), item('c')]);
    q = markFailed(q, 'b');
    expect(pendingCount(q)).toBe(2);
    expect(failedCount(q)).toBe(1);
  });
});

describe('toOptimisticRow', () => {
  it('produces exactly a server-row shape — no marker fields', () => {
    const row = toOptimisticRow(item('uuid-1'));
    expect(Object.keys(row).sort()).toEqual(
      ['amount', 'category', 'date', 'debt_id', 'id', 'note', 'payment_method', 'type', 'user_id'].sort()
    );
    expect(row.id).toBe('uuid-1');
    expect(row.amount).toBe(250);
  });
});

describe('mergeServerWithPending', () => {
  it('puts pending rows first', () => {
    const server = [{ id: 's1', amount: 10 }];
    const merged = mergeServerWithPending(server, [item('p1')]);
    expect(merged.map(r => r.id)).toEqual(['p1', 's1']);
  });

  it('drops the server copy once an item has landed under the same id', () => {
    // The client-supplied UUID means the synced row and the pending row share
    // an id — it must appear once, not twice.
    const server = [{ id: 'p1', amount: 250 }, { id: 's1', amount: 10 }];
    const merged = mergeServerWithPending(server, [item('p1')]);
    expect(merged.map(r => r.id)).toEqual(['p1', 's1']);
  });

  it('does NOT dedupe by content — two identical expenses are legitimate', () => {
    const server = [{ ...PAYLOAD, id: 'server-row' }];
    const merged = mergeServerWithPending(server, [item('pending-row')]);
    expect(merged).toHaveLength(2);
  });

  it('handles empty inputs', () => {
    expect(mergeServerWithPending([], [])).toEqual([]);
    expect(mergeServerWithPending(undefined, undefined)).toEqual([]);
    expect(mergeServerWithPending([{ id: 's' }], [])).toHaveLength(1);
  });
});

describe('serializeQueue / deserializeQueue', () => {
  it('round-trips', () => {
    const q = enqueueMany(emptyQueue(USER), [item('a'), item('b')]);
    const out = deserializeQueue(serializeQueue(q), USER);
    expect(out.items.map(i => i.id)).toEqual(['a', 'b']);
    expect(out.items[0].payload).toEqual(PAYLOAD);
  });

  it('returns null and never throws for unusable blobs', () => {
    ['{', '', 'null', '[]', '42', '"str"'].forEach((raw) => {
      expect(() => deserializeQueue(raw, USER)).not.toThrow();
      expect(deserializeQueue(raw, USER)).toBeNull();
    });
    expect(deserializeQueue(null, USER)).toBeNull();
  });

  it('rejects a wrong version or a different user', () => {
    const q = enqueue(emptyQueue(USER), item('a'));
    expect(deserializeQueue(JSON.stringify({ ...q, v: QUEUE_VERSION + 1 }), USER)).toBeNull();
    expect(deserializeQueue(serializeQueue(q), 'other-user')).toBeNull();
  });

  it('rejects a non-array items field', () => {
    const raw = JSON.stringify({ v: QUEUE_VERSION, userId: USER, items: 'nope' });
    expect(deserializeQueue(raw, USER)).toBeNull();
  });

  // The queue holds the only copy of this data, so one bad entry must not take
  // the good ones with it.
  it('drops individual malformed items but keeps the rest', () => {
    const good = item('good');
    const raw = JSON.stringify({
      v: QUEUE_VERSION,
      userId: USER,
      items: [good, null, { id: 'no-payload' }, { payload: {}, createdAt: 1 }, 'string', good2()],
    });
    const out = deserializeQueue(raw, USER);
    expect(out.items.map(i => i.id)).toEqual(['good', 'good2']);
  });

  it('repairs missing attempts/state on read', () => {
    const raw = JSON.stringify({
      v: QUEUE_VERSION,
      userId: USER,
      items: [{ id: 'a', payload: PAYLOAD, createdAt: NOW }],
    });
    const i = deserializeQueue(raw, USER).items[0];
    expect(i.attempts).toBe(0);
    expect(i.state).toBe('pending');
  });
});

function good2() {
  return createPendingItem({ payload: PAYLOAD, now: NOW, id: 'good2' });
}
