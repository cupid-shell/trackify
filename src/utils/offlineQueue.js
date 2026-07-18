// Durable queue of transaction inserts that haven't reached the server yet.
// Unlike the offline cache (a disposable copy of server data), this holds the
// ONLY copy of something the user typed — so nothing here is ever dropped
// silently. An item that exhausts its retries becomes `failed` and stays put,
// visible, with explicit Retry and Discard actions.
//
// Inserts only. Edits, deletes, debts and settings are all read-modify-write
// over a whole JSON blob rebuilt from live state; replaying a queued snapshot of
// those would silently destroy any change made in between. An insert payload is
// frozen at enqueue time and is complete on its own, which is what makes it safe
// to replay.
//
// Every function here is pure and takes `now`/`rand`/`id` as arguments rather
// than calling Date.now()/Math.random()/uuid internally — required by the React
// Compiler's purity rule, and it makes the retry schedule testable.

export const QUEUE_VERSION = 1;

// After this many failed attempts an item stops retrying and asks the user.
// ~8 attempts spans roughly 8.5 minutes of backoff.
export const MAX_ATTEMPTS = 8;

// Refuse to grow past this. Better a loud error than silently eating storage.
export const MAX_QUEUE = 500;

export const MAX_BACKOFF_MS = 300_000; // 5 minutes

export const queueKey = (userId) => `trackify_pending_tx_${userId}`;

// Exponential: 2s, 4s, 8s … capped at 5 minutes.
export const backoffDelayMs = (attempts) =>
  Math.min(MAX_BACKOFF_MS, 2000 * 2 ** Math.max(0, attempts - 1));

// Jittered so a batch that failed together doesn't retry in lockstep.
// `rand` is a 0..1 value supplied by the caller.
export const nextAttemptAt = (attempts, now, rand) =>
  now + Math.round(backoffDelayMs(attempts) * (0.75 + rand * 0.5));

// `id` is a client-generated UUID that becomes the row's PRIMARY KEY. That is
// the whole trick: a replay after a lost response collides on the PK instead of
// inserting a duplicate, so at-least-once delivery behaves as exactly-once.
export const createPendingItem = ({ payload, batchId = null, batchIndex = 0, now, id }) => ({
  id,
  payload,
  batchId,
  batchIndex,
  createdAt: now,
  attempts: 0,
  lastAttemptAt: null,
  nextAttemptAt: now,
  lastError: null,
  state: 'pending',
});

export const emptyQueue = (userId) => ({ v: QUEUE_VERSION, userId, items: [] });

// All queue operations rebuild rather than mutate — required by the React
// Compiler's immutability rule, and it keeps callers honest about persisting.
export const enqueue = (queue, item) => {
  if (queue.items.length >= MAX_QUEUE) return queue;
  return { ...queue, items: [...queue.items, item] };
};

export const enqueueMany = (queue, items) => {
  const room = MAX_QUEUE - queue.items.length;
  if (room <= 0) return queue;
  return { ...queue, items: [...queue.items, ...items.slice(0, room)] };
};

// Returns the SAME reference when the id isn't present, so callers can skip a
// pointless write. (Matches the convention moveInList sets in budgetOrder.js.)
export const dequeue = (queue, id) => {
  if (!queue.items.some((i) => i.id === id)) return queue;
  return { ...queue, items: queue.items.filter((i) => i.id !== id) };
};

const mapItem = (queue, id, fn) => {
  if (!queue.items.some((i) => i.id === id)) return queue;
  return { ...queue, items: queue.items.map((i) => (i.id === id ? fn(i) : i)) };
};

// Record a failed attempt and schedule the next one. Crossing MAX_ATTEMPTS
// flips the item to `failed` — it stops retrying but is never removed.
export const markAttempt = (queue, id, { now, error = null, rand = 0.5 }) =>
  mapItem(queue, id, (item) => {
    const attempts = item.attempts + 1;
    const exhausted = attempts >= MAX_ATTEMPTS;
    return {
      ...item,
      attempts,
      lastAttemptAt: now,
      lastError: error,
      state: exhausted ? 'failed' : 'pending',
      nextAttemptAt: exhausted ? null : nextAttemptAt(attempts, now, rand),
    };
  });

// Straight to `failed` without burning attempts — for errors that retrying
// cannot possibly fix (permission denied, constraint violation).
export const markFailed = (queue, id, error = null) =>
  mapItem(queue, id, (item) => ({
    ...item,
    state: 'failed',
    lastError: error,
    nextAttemptAt: null,
  }));

// User-driven "try this again": clears the attempt history entirely.
export const resetItem = (queue, id, now) =>
  mapItem(queue, id, (item) => ({
    ...item,
    attempts: 0,
    state: 'pending',
    lastError: null,
    nextAttemptAt: now,
  }));

// Items eligible to send right now, oldest first.
//
// The clamp matters: if the device clock jumps BACKWARD (timezone fix, NTP
// correction, manual change), an item scheduled against the old clock can sit
// with a nextAttemptAt far in the future and the queue stalls forever with no
// error anywhere. Anything scheduled further out than the maximum possible
// backoff is therefore impossible and treated as due.
export const dueItems = (queue, now) =>
  queue.items
    .filter((i) => i.state === 'pending')
    .filter((i) => {
      const at = i.nextAttemptAt;
      if (typeof at !== 'number') return true;
      if (at - now > MAX_BACKOFF_MS) return true; // clock skew
      return at <= now;
    })
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt);

export const pendingCount = (queue) => queue.items.filter((i) => i.state === 'pending').length;
export const failedCount = (queue) => queue.items.filter((i) => i.state === 'failed').length;

// The optimistic row shown in the UI while an item is unsynced. Deliberately
// shaped EXACTLY like a server row (no extra marker field) so it can't poison
// the cache or the CSV/PDF export paths — "is this pending?" is answered by a
// separate id lookup, not by a property on the transaction.
export const toOptimisticRow = (item) => ({ id: item.id, ...item.payload });

// Pending rows first (they're the newest thing the user did), then the server's.
// No dedup by content: two identical expenses on the same day are a normal
// thing to record, and the client UUID already prevents true duplicates.
export const mergeServerWithPending = (serverRows = [], items = []) => {
  const pendingRows = items.map(toOptimisticRow);
  const pendingIds = new Set(pendingRows.map((r) => r.id));
  return [...pendingRows, ...serverRows.filter((r) => !pendingIds.has(r.id))];
};

export const serializeQueue = (queue) =>
  JSON.stringify({ v: QUEUE_VERSION, userId: queue.userId, items: queue.items });

const isValidItem = (i) =>
  i && typeof i === 'object' &&
  typeof i.id === 'string' && i.id.length > 0 &&
  i.payload && typeof i.payload === 'object' &&
  typeof i.createdAt === 'number';

// Unlike the cache, a queue holds data that exists nowhere else — so a single
// corrupt entry drops THAT ENTRY, not the whole queue. Only a wholly unusable
// blob (bad JSON, wrong version, wrong user) yields null.
// ---------------------------------------------------------------------------
// Impure localStorage shell. localStorage — not React state — is the source of
// truth for the queue: flushQueue re-reads it on every iteration, which kills
// stale-closure bugs and makes a second tab's progress visible mid-pass.
// ---------------------------------------------------------------------------

export const readQueue = (userId) => {
  if (!userId) return null;
  try {
    return deserializeQueue(localStorage.getItem(queueKey(userId)), userId) || emptyQueue(userId);
  } catch {
    return emptyQueue(userId);
  }
};

// The queue is always written BEFORE the cache: a quota failure must never be
// able to lose unsynced user data in order to store a disposable copy of server
// data. Returns false if it could not be persisted.
export const writeQueue = (queue) => {
  if (!queue?.userId) return false;
  try {
    localStorage.setItem(queueKey(queue.userId), serializeQueue(queue));
    return true;
  } catch {
    return false;
  }
};

export const clearQueue = (userId) => {
  if (!userId) return;
  try {
    localStorage.removeItem(queueKey(userId));
  } catch {
    // Nothing useful to do.
  }
};

export const deserializeQueue = (raw, expectedUserId) => {
  if (typeof raw !== 'string' || raw.length === 0) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  if (parsed.v !== QUEUE_VERSION) return null;
  if (!parsed.userId || parsed.userId !== expectedUserId) return null;
  if (!Array.isArray(parsed.items)) return null;

  return {
    v: parsed.v,
    userId: parsed.userId,
    items: parsed.items.filter(isValidItem).map((i) => ({
      ...i,
      attempts: typeof i.attempts === 'number' ? i.attempts : 0,
      state: i.state === 'failed' ? 'failed' : 'pending',
    })),
  };
};
