import { describe, it, expect } from 'vitest';
import { isNetworkError, isPermanentError, isDuplicateKeyError, describeSyncError } from './network';

describe('isNetworkError', () => {
  // supabase-js reports transport failures with an EMPTY-STRING code, not
  // undefined — the distinction matters, so pin it.
  it('is true for the shapes supabase-js actually produces offline', () => {
    expect(isNetworkError({ message: 'TypeError: Failed to fetch', code: '' })).toBe(true);
    expect(isNetworkError({ message: 'FetchError: request failed', code: '' })).toBe(true);
    expect(isNetworkError({ message: 'AbortError: The operation was aborted', code: '' })).toBe(true);
    expect(isNetworkError({ message: 'NetworkError when attempting to fetch resource.', code: '' })).toBe(true);
    expect(isNetworkError({ message: 'Network request failed' })).toBe(true);
    expect(isNetworkError({ message: 'Load failed', code: '' })).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(isNetworkError({ message: 'failed to fetch', code: '' })).toBe(true);
    expect(isNetworkError({ message: 'FAILED TO FETCH', code: '' })).toBe(true);
  });

  it('falls back to the error name when there is no message', () => {
    expect(isNetworkError({ name: 'AbortError', code: '' })).toBe(true);
  });

  // Queueing a permanent error means retrying it forever, so these must all
  // be false. Anything carrying a real code came from the server.
  it('is false for server-side errors, which always carry a code', () => {
    expect(isNetworkError({ message: 'no rows', code: 'PGRST116' })).toBe(false);
    expect(isNetworkError({ message: 'column missing', code: 'PGRST204' })).toBe(false);
    expect(isNetworkError({ message: 'duplicate key', code: '23505' })).toBe(false);
    expect(isNetworkError({ message: 'permission denied', code: '42501' })).toBe(false);
  });

  it('is false for an unrecognised message with no code (default to permanent)', () => {
    expect(isNetworkError({ message: 'something weird happened', code: '' })).toBe(false);
    expect(isNetworkError({ message: '' })).toBe(false);
    expect(isNetworkError({})).toBe(false);
  });

  it('is null/undefined safe', () => {
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });

  it('does not treat a coded error as transient even if the message looks it', () => {
    // A server that genuinely rejected us, whose message happens to mention a
    // timeout, must not be retried forever.
    expect(isNetworkError({ message: 'statement timeout', code: '57014' })).toBe(false);
  });
});

describe('isPermanentError', () => {
  it('is the exact inverse of isNetworkError', () => {
    const cases = [
      { message: 'Failed to fetch', code: '' },
      { message: 'permission denied', code: '42501' },
      {},
      null,
    ];
    cases.forEach((e) => expect(isPermanentError(e)).toBe(!isNetworkError(e)));
  });
});

describe('isDuplicateKeyError', () => {
  it('detects a primary-key collision, which a replay treats as success', () => {
    expect(isDuplicateKeyError({ code: '23505' })).toBe(true);
    expect(isDuplicateKeyError({ code: '23503' })).toBe(false);
    expect(isDuplicateKeyError(null)).toBe(false);
  });
});

describe('describeSyncError', () => {
  it('turns transport failures into a sentence', () => {
    expect(describeSyncError({ message: 'TypeError: Failed to fetch', code: '' }))
      .toBe("Couldn't reach the server");
  });

  it('names the common server rejections', () => {
    expect(describeSyncError({ code: '42501', message: 'x' })).toBe('Permission denied by the database');
    expect(describeSyncError({ code: '23505', message: 'x' })).toBe('Already saved');
  });

  it('passes through an unrecognised server message', () => {
    expect(describeSyncError({ code: 'PGRST999', message: 'weird' })).toBe('weird');
  });

  it('is null safe', () => {
    expect(describeSyncError(null)).toBe('Unknown error');
  });
});
