/**
 * Format batting average (AVG / OBP / SLG): returns e.g. ".310" or "1.025" or "---"
 */
export function formatRateStat(val?: string | number): string {
  if (val === undefined || val === null || val === '') return '---';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '---';
  
  if (num < 1 && num >= 0) {
    return num.toFixed(3).replace(/^0\./, '.');
  }
  return num.toFixed(3);
}

/**
 * Format pitching ERA (e.g. "2.45" or "0.00" or "---")
 */
export function formatEra(era?: string | number): string {
  if (era === undefined || era === null || era === '') return '---';
  const num = typeof era === 'string' ? parseFloat(era) : era;
  if (isNaN(num)) return '---';
  return num.toFixed(2);
}

/**
 * Format pitching WHIP (e.g. "0.98" or "---")
 */
export function formatWhip(whip?: string | number): string {
  if (whip === undefined || whip === null || whip === '') return '---';
  const num = typeof whip === 'string' ? parseFloat(whip) : whip;
  if (isNaN(num)) return '---';
  return num.toFixed(2);
}

/**
 * Format Pitcher W-L record (e.g. "15-4")
 */
export function formatRecord(wins?: number, losses?: number): string {
  if (wins === undefined || losses === undefined) return '-';
  return `${wins}-${losses}`;
}

/**
 * Format Out count dots (0, 1, 2, 3)
 */
export function getOutDots(outs: number = 0): [boolean, boolean, boolean] {
  return [outs >= 1, outs >= 2, outs >= 3];
}
