// Telling "the network dropped" apart from "the server refused this" is the
// highest-stakes decision in the offline write queue. Get it wrong in one
// direction and a genuinely rejected row (RLS violation, constraint breach) is
// retried forever; get it wrong in the other and a recoverable blip throws the
// user's data away. So the rule is deliberately asymmetric: only retry what we
// can positively identify as a transport failure, and treat everything else as
// permanent.

// supabase-js surfaces transport failures as a value, not a throw, with an
// EMPTY-STRING code (not undefined) and the underlying fetch error in message.
const TRANSIENT_MESSAGE = /(failed to fetch|networkerror|network request failed|fetcherror|aborterror|the operation was aborted|timeout|timed out|load failed|connection)/i;

// True only when this looks like a transport failure worth retrying.
export const isNetworkError = (error) => {
  if (!error) return false;

  // Anything carrying a real PostgREST/Postgres code came FROM the server,
  // which means the request arrived — by definition not a network failure.
  const { code } = error;
  if (code !== undefined && code !== null && code !== '') return false;

  return TRANSIENT_MESSAGE.test(String(error.message || error.name || ''));
};

// Anything we can't positively identify as transient. Defaulting to permanent
// is the safe direction: a permanent item stops and asks the user, whereas a
// mislabelled permanent error would retry until the attempt ceiling for nothing.
export const isPermanentError = (error) => !isNetworkError(error);

// Duplicate primary key. With client-supplied UUIDs this is what a *successful*
// insert looks like on replay when the original response was lost, so callers
// treat it as success rather than an error.
export const isDuplicateKeyError = (error) => error?.code === '23505';

// Human-readable, for a toast or a failed-item chip. Raw Supabase strings like
// "TypeError: Failed to fetch" are not a sentence.
export const describeSyncError = (error) => {
  if (!error) return 'Unknown error';
  if (isNetworkError(error)) return "Couldn't reach the server";
  if (error.code === '42501') return 'Permission denied by the database';
  if (isDuplicateKeyError(error)) return 'Already saved';
  return error.message || 'Sync failed';
};
