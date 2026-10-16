/**
 * Convert the MLB API height string (e.g. `6' 2"`) to whole centimeters.
 * Returns null when the string doesn't match the feet/inches format.
 */
export function heightToCm(height?: string | null): number | null {
  if (!height) return null;
  const match = height.match(/^\s*(\d+)\s*'\s*(\d+)?\s*"?\s*$/);
  if (!match) return null;
  const totalInches = Number(match[1]) * 12 + Number(match[2] ?? 0);
  return Math.round(totalInches * 2.54);
}

/**
 * Convert pounds (MLB API `weight`) to whole kilograms.
 * Returns null for missing or non-positive values.
 */
export function lbsToKg(lbs?: number | null): number | null {
  if (lbs === undefined || lbs === null || !Number.isFinite(lbs) || lbs <= 0) return null;
  return Math.round(lbs * 0.45359237);
}

/**
 * Format height/weight showing both imperial and metric units. The unit
 * system native to the UI language comes first; the other is in parentheses.
 *   zh: `188 cm / 110 kg（6' 2" / 243 lbs）`
 *   en: `6' 2" / 243 lbs (188 cm / 110 kg)`
 * Falls back to imperial only when the height can't be converted.
 */
export function formatPhysique(height: string, weightLbs: number, lang: 'zh' | 'en'): string {
  const imperial = `${height} / ${weightLbs} lbs`;
  const cm = heightToCm(height);
  const kg = lbsToKg(weightLbs);
  if (cm === null || kg === null) return imperial;
  const metric = `${cm} cm / ${kg} kg`;
  return lang === 'zh' ? `${metric}（${imperial}）` : `${imperial} (${metric})`;
}
