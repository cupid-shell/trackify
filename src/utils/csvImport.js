// Parsing and validation for importing a transactions CSV — the other half of
// the all-time export in Settings, which until now could only write.
//
// Pure and side-effect free on purpose: this decides what a file *contains* and
// what is wrong with it. Nothing here writes, and nothing here talks to
// Supabase, so a malformed file is a report rather than a mess to clean up.

import { parseLocalDate } from './date';

const TYPES = ['income', 'expense'];

// Writing side, kept here so the two directions can't drift apart.
//
// Mitigates CSV formula injection (a leading = + - @ is executed by
// spreadsheets) and quotes anything containing a comma, quote or newline.
// parseCsv undoes both, so an export round-trips back to what it came from.
export const escapeCsvField = (val) => {
  if (val === undefined || val === null) return '';
  let str = String(val);
  if (/^[=+\-@]/.test(str)) str = `'${str}`;
  if (/[",\n\r]/.test(str)) str = `"${str.replace(/"/g, '""')}"`;
  return str;
};

// RFC 4180-ish reader: quoted fields, "" as a literal quote inside them, and
// commas or newlines within quotes. Written as a character scanner rather than
// a split() because a note like "Print, binding" is exactly the case a naive
// split gets wrong.
export const parseCsv = (text) => {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  let i = 0;

  // A leading BOM survives Excel round-trips and would otherwise become part
  // of the first header name.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const endField = () => { row.push(field); field = ''; };
  const endRow = () => { endField(); rows.push(row); row = []; };

  while (i < src.length) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i += 1; continue;
      }
      field += ch; i += 1; continue;
    }

    if (ch === '"') { inQuotes = true; i += 1; continue; }
    if (ch === ',') { endField(); i += 1; continue; }
    if (ch === '\r') { i += 1; continue; }
    if (ch === '\n') { endRow(); i += 1; continue; }

    field += ch; i += 1;
  }

  // Trailing field/row unless the file ended on a newline with nothing after.
  if (field !== '' || row.length > 0) endRow();

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
};

// The export prepends ' to any field starting with = + - @ so spreadsheets
// don't execute it. Undo that on the way back in, or notes come back mangled.
const unescapeInjectionGuard = (value) =>
  /^'[=+\-@]/.test(value) ? value.slice(1) : value;

const HEADER_ALIASES = {
  date: 'date',
  type: 'type',
  category: 'category',
  'payment method': 'payment_method',
  payment: 'payment_method',
  note: 'note',
  notes: 'note',
};

// "Amount (BDT)" carries the currency, so amount is matched by prefix.
export const mapHeaders = (headerRow) =>
  headerRow.map((raw) => {
    const key = raw.trim().toLowerCase();
    if (key.startsWith('amount')) return 'amount';
    return HEADER_ALIASES[key] || null;
  });

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(new Date(value).getTime());

// Turns raw text into rows ready to insert, plus a per-row list of what was
// rejected and why. Both are returned together: a file with three bad rows out
// of two hundred should still be importable, with the three named.
export const parseTransactionCsv = (text) => {
  const rows = parseCsv(text || '');
  if (rows.length === 0) {
    return { valid: [], errors: [], missingColumns: ['Date', 'Type', 'Category', 'Amount'] };
  }

  const columns = mapHeaders(rows[0]);
  const required = ['date', 'type', 'category', 'amount'];
  const missingColumns = required.filter((c) => !columns.includes(c));
  if (missingColumns.length > 0) {
    return { valid: [], errors: [], missingColumns };
  }

  const indexOf = (name) => columns.indexOf(name);
  const valid = [];
  const errors = [];

  rows.slice(1).forEach((cells, idx) => {
    // +2: one for the header row, one because humans count from 1.
    const line = idx + 2;
    const at = (name) => {
      const col = indexOf(name);
      return col === -1 ? '' : unescapeInjectionGuard((cells[col] ?? '').trim());
    };

    const date = at('date');
    const type = at('type').toLowerCase();
    const category = at('category');
    const rawAmount = at('amount');
    const amount = Number(rawAmount.replace(/,/g, ''));

    const problems = [];
    if (!isValidDate(date)) problems.push(`date "${date}" is not YYYY-MM-DD`);
    if (!TYPES.includes(type)) problems.push(`type "${type}" is not income or expense`);
    if (!category) problems.push('category is empty');
    if (!rawAmount) problems.push('amount is empty');
    else if (!Number.isFinite(amount)) problems.push(`amount "${rawAmount}" is not a number`);
    else if (amount <= 0) problems.push(`amount ${amount} is not greater than zero`);

    if (problems.length > 0) {
      errors.push({ line, problems, cells });
      return;
    }

    valid.push({
      date: date.slice(0, 10),
      type,
      category,
      amount,
      payment_method: at('payment_method') || 'Cash',
      note: at('note') || null,
    });
  });

  return { valid, errors, missingColumns: [] };
};

// A transaction's natural key. The export carries no id, so re-importing the
// same file cannot be caught by primary key — this is what stands in for one.
//
// The date goes through parseLocalDate rather than being sliced off the raw
// string. Stored dates are UTC ISO timestamps (the forms build them with
// toISOString) while the exporter writes the LOCAL calendar date, so slicing
// produced "2026-07-21" for a row the export had written as "2026-07-22". At
// UTC+6 that hit everything logged between midnight and 6am: those rows failed
// to recognise themselves on re-import and looked like new ones.
//
// Joined with an explicit NUL escape because it cannot occur in any part; a
// space would let category "Food" + note "x" collide with category "Food x"
// and no note.
const localYmd = (value) => {
  const d = parseLocalDate(value);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

export const rowFingerprint = (tx) =>
  [
    localYmd(tx.date),
    tx.type,
    tx.category,
    Number(tx.amount),
    (tx.note || '').trim(),
  ].join('\u0000');

// The export carries a calendar date but no time, so an imported row has to be
// given one. Local noon, not midnight: the value is stored as a UTC timestamp,
// and midnight sits close enough to the boundary that a UTC offset in either
// direction can land it on the neighbouring day. Noon survives every offset, so
// the row keeps the date the file said.
//
// The original time of day is not recoverable — the export never had it.
export const toStoredTimestamp = (ymd) => {
  const [year, month, day] = String(ymd).slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
};

// Splits parsed rows against what is already stored.
//
// Deliberately conservative: anything matching an existing row on date, type,
// category, amount and note is reported as a duplicate rather than skipped
// silently, because two genuinely separate identical purchases on one day are
// possible and only the user can tell those apart from a double import.
export const detectDuplicates = (parsedRows, existingTransactions = []) => {
  const seen = new Set(existingTransactions.map(rowFingerprint));
  const withinFile = new Set();
  const fresh = [];
  const duplicates = [];

  parsedRows.forEach((row) => {
    const key = rowFingerprint(row);
    if (seen.has(key)) {
      duplicates.push({ row, reason: 'already in your history' });
      return;
    }
    if (withinFile.has(key)) {
      duplicates.push({ row, reason: 'repeated inside this file' });
      return;
    }
    withinFile.add(key);
    fresh.push(row);
  });

  return { fresh, duplicates };
};
