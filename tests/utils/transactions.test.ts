import { describe, it, expect } from 'vitest';
import { isTrade, sortTransactions, transactionDate, transactionTypeLabel } from '../../src/utils/transactions';

describe('transactions', () => {
  it('names a move in Chinese from its English description', () => {
    expect(transactionTypeLabel({ typeCode: 'TR', typeDesc: 'Trade' }, 'zh')).toBe('交易');
    expect(transactionTypeLabel({ typeCode: 'OPT', typeDesc: 'Optioned' }, 'zh')).toBe('下放小聯盟');
  });

  it('keeps the API text for an unknown type and in English', () => {
    expect(transactionTypeLabel({ typeCode: 'XYZ', typeDesc: 'Something New' }, 'zh')).toBe('Something New');
    expect(transactionTypeLabel({ typeCode: 'TR', typeDesc: 'Trade' }, 'en')).toBe('Trade');
    expect(transactionTypeLabel({ typeCode: 'TR' }, 'zh')).toBe('TR');
  });

  it('recognises a trade by code or description', () => {
    expect(isTrade({ typeCode: 'TR' })).toBe(true);
    expect(isTrade({ typeDesc: 'Trade' })).toBe(true);
    expect(isTrade({ typeCode: 'OPT', typeDesc: 'Optioned' })).toBe(false);
  });

  it('dates a move by its date, else when it took effect', () => {
    expect(transactionDate({ date: '2026-07-30', effectiveDate: '2026-07-31' })).toBe('2026-07-30');
    expect(transactionDate({ effectiveDate: '2026-07-31' })).toBe('2026-07-31');
    expect(transactionDate({})).toBe('');
  });

  it('sorts newest first without touching the input', () => {
    const input = [{ id: 1, date: '2024-03-01' }, { id: 2, date: '2026-07-30' }, { id: 3, date: '2025-11-02' }];
    expect(sortTransactions(input).map((t) => t.id)).toEqual([2, 3, 1]);
    expect(input.map((t) => t.id)).toEqual([1, 2, 3]);
    expect(sortTransactions(undefined)).toEqual([]);
  });
});
