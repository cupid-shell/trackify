import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  mapHeaders,
  parseTransactionCsv,
  rowFingerprint,
  detectDuplicates,
} from './csvImport';

const HEADER = 'Date,Type,Category,Payment Method,Amount (BDT),Note';

describe('parseCsv', () => {
  it('reads a plain grid', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('keeps commas inside quoted fields', () => {
    expect(parseCsv('a,b\n"Print, binding",2')).toEqual([['a', 'b'], ['Print, binding', '2']]);
  });

  it('unescapes a doubled quote', () => {
    expect(parseCsv('note\n"He said ""hi"""')).toEqual([['note'], ['He said "hi"']]);
  });

  it('handles a newline inside a quoted field', () => {
    expect(parseCsv('note\n"line one\nline two"')).toEqual([['note'], ['line one\nline two']]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('strips a leading BOM so the first header is clean', () => {
    expect(parseCsv('﻿Date,Type')[0]).toEqual(['Date', 'Type']);
  });

  it('drops blank trailing lines', () => {
    expect(parseCsv('a\n1\n\n')).toEqual([['a'], ['1']]);
  });

  it('returns nothing for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

describe('mapHeaders', () => {
  it('matches the export header row', () => {
    expect(mapHeaders(HEADER.split(','))).toEqual([
      'date', 'type', 'category', 'payment_method', 'amount', 'note',
    ]);
  });

  it('matches amount whatever currency it carries', () => {
    expect(mapHeaders(['Amount (USD)'])).toEqual(['amount']);
    expect(mapHeaders(['amount'])).toEqual(['amount']);
  });

  it('is case and whitespace tolerant', () => {
    expect(mapHeaders([' DATE ', 'note'])).toEqual(['date', 'note']);
  });

  it('reports unknown columns as null', () => {
    expect(mapHeaders(['Nonsense'])).toEqual([null]);
  });
});

describe('parseTransactionCsv', () => {
  it('parses a well-formed file', () => {
    const csv = `${HEADER}\n2026-07-21,expense,Daily Living,Cash,10,Print`;
    const { valid, errors, missingColumns } = parseTransactionCsv(csv);
    expect(missingColumns).toEqual([]);
    expect(errors).toEqual([]);
    expect(valid).toEqual([{
      date: '2026-07-21',
      type: 'expense',
      category: 'Daily Living',
      amount: 10,
      payment_method: 'Cash',
      note: 'Print',
    }]);
  });

  it('reports missing required columns instead of guessing', () => {
    const { missingColumns, valid } = parseTransactionCsv('Date,Note\n2026-07-21,hi');
    expect(missingColumns).toEqual(['type', 'category', 'amount']);
    expect(valid).toEqual([]);
  });

  it('defaults an absent payment method to Cash', () => {
    const csv = 'Date,Type,Category,Amount\n2026-07-21,expense,Food,50';
    expect(parseTransactionCsv(csv).valid[0].payment_method).toBe('Cash');
  });

  it('normalises type casing', () => {
    const csv = `${HEADER}\n2026-07-21,EXPENSE,Food,Cash,50,`;
    expect(parseTransactionCsv(csv).valid[0].type).toBe('expense');
  });

  it('stores an empty note as null', () => {
    const csv = `${HEADER}\n2026-07-21,expense,Food,Cash,50,`;
    expect(parseTransactionCsv(csv).valid[0].note).toBeNull();
  });

  it('accepts a thousands separator in the amount', () => {
    const csv = `${HEADER}\n2026-07-21,expense,Rent,Cash,"15,248",`;
    expect(parseTransactionCsv(csv).valid[0].amount).toBe(15248);
  });

  it('undoes the export CSV-injection guard', () => {
    const csv = `${HEADER}\n2026-07-21,expense,Food,Cash,50,'=SUM(A1)`;
    expect(parseTransactionCsv(csv).valid[0].note).toBe('=SUM(A1)');
  });

  it('keeps good rows and reports bad ones by line number', () => {
    const csv = [
      HEADER,
      '2026-07-21,expense,Food,Cash,50,ok',
      'not-a-date,expense,Food,Cash,50,bad date',
      '2026-07-22,transfer,Food,Cash,50,bad type',
      '2026-07-23,expense,,Cash,50,no category',
      '2026-07-24,expense,Food,Cash,abc,bad amount',
      '2026-07-25,expense,Food,Cash,-5,negative',
      '2026-07-26,expense,Food,Cash,25,also ok',
    ].join('\n');

    const { valid, errors } = parseTransactionCsv(csv);
    expect(valid.map((v) => v.note)).toEqual(['ok', 'also ok']);
    expect(errors.map((e) => e.line)).toEqual([3, 4, 5, 6, 7]);
    expect(errors[0].problems[0]).toContain('not YYYY-MM-DD');
    expect(errors[1].problems[0]).toContain('income or expense');
    expect(errors[2].problems[0]).toContain('category is empty');
    expect(errors[4].problems[0]).toContain('greater than zero');
  });

  it('handles an empty file without throwing', () => {
    const r = parseTransactionCsv('');
    expect(r.valid).toEqual([]);
    expect(r.missingColumns.length).toBeGreaterThan(0);
  });

  it('handles a header with no data rows', () => {
    const r = parseTransactionCsv(HEADER);
    expect(r.valid).toEqual([]);
    expect(r.errors).toEqual([]);
    expect(r.missingColumns).toEqual([]);
  });

  it('round-trips a note containing a comma', () => {
    const csv = `${HEADER}\n2026-07-20,expense,Other,Cash,170,"Print, binding, wool"`;
    expect(parseTransactionCsv(csv).valid[0].note).toBe('Print, binding, wool');
  });
});

describe('detectDuplicates', () => {
  const row = (over = {}) => ({
    date: '2026-07-21', type: 'expense', category: 'Food', amount: 50, note: 'lunch', ...over,
  });

  it('treats an identical existing transaction as a duplicate', () => {
    const { fresh, duplicates } = detectDuplicates([row()], [row()]);
    expect(fresh).toEqual([]);
    expect(duplicates[0].reason).toBe('already in your history');
  });

  it('lets a genuinely new row through', () => {
    const { fresh, duplicates } = detectDuplicates([row({ amount: 99 })], [row()]);
    expect(fresh).toHaveLength(1);
    expect(duplicates).toEqual([]);
  });

  it('catches a row repeated inside the file itself', () => {
    const { fresh, duplicates } = detectDuplicates([row(), row()], []);
    expect(fresh).toHaveLength(1);
    expect(duplicates[0].reason).toBe('repeated inside this file');
  });

  it('distinguishes rows that differ only by note', () => {
    const { fresh } = detectDuplicates([row({ note: 'dinner' })], [row()]);
    expect(fresh).toHaveLength(1);
  });

  it('ignores a time component on the stored date', () => {
    const stored = { ...row(), date: '2026-07-21T14:30:00' };
    const { duplicates } = detectDuplicates([row()], [stored]);
    expect(duplicates).toHaveLength(1);
  });

  it('reports nothing for an empty import', () => {
    expect(detectDuplicates([], [row()])).toEqual({ fresh: [], duplicates: [] });
  });
});

describe('rowFingerprint', () => {
  it('is stable across equivalent shapes', () => {
    expect(rowFingerprint({ date: '2026-07-21T09:00:00', type: 'expense', category: 'Food', amount: '50', note: ' lunch ' }))
      .toBe(rowFingerprint({ date: '2026-07-21', type: 'expense', category: 'Food', amount: 50, note: 'lunch' }));
  });

  it('separates different amounts', () => {
    expect(rowFingerprint({ date: '2026-07-21', type: 'expense', category: 'Food', amount: 50 }))
      .not.toBe(rowFingerprint({ date: '2026-07-21', type: 'expense', category: 'Food', amount: 51 }));
  });
});
