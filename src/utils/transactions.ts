import type { Transaction } from '../types/transactions';

/**
 * Chinese names for the move types, keyed by the API's English `typeDesc`
 * rather than its code: the description is what the API shows, so a type
 * missing here falls back to that English text instead of a wrong label.
 */
const TYPE_DESC_ZH: Record<string, string> = {
  Trade: '交易',
  'Signed as Free Agent': '簽約（自由球員）',
  Signed: '簽約',
  'Signed as Draft Pick': '選秀簽約',
  'Declared Free Agency': '成為自由球員',
  Released: '釋出',
  'Designated for Assignment': '指定讓渡 (DFA)',
  'Claimed Off Waivers': '被認領',
  Outrighted: '下放（移出 40 人名單）',
  Optioned: '下放小聯盟',
  Recalled: '召回大聯盟',
  Selected: '升上大聯盟（選入 40 人名單）',
  Assigned: '分派',
  'Status Change': '名單狀態變更',
  'Number Change': '背號變更',
  Retired: '退休',
  Returned: '退回',
  'Rehab Assignment': '復健出賽',
};

/** Date the move is filed under: its own date, else when it took effect */
export const transactionDate = (t: Transaction): string => t.date ?? t.effectiveDate ?? '';

export function isTrade(t: Transaction): boolean {
  return t.typeCode === 'TR' || t.typeDesc === 'Trade';
}

export function transactionTypeLabel(t: Transaction, lang: 'zh' | 'en'): string {
  const desc = t.typeDesc ?? t.typeCode ?? '';
  return lang === 'zh' ? TYPE_DESC_ZH[desc] ?? desc : desc;
}

/** Newest first; moves on the same day keep the API's order */
export function sortTransactions(transactions: Transaction[] | undefined): Transaction[] {
  return [...(transactions ?? [])].sort((a, b) => transactionDate(b).localeCompare(transactionDate(a)));
}
