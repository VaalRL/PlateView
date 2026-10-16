import teamsData from '../data/teams.json';
import type { Language } from '../i18n/translations';

export type TeamMeta = (typeof teamsData)[number];

/** The 30 big league clubs by id; minor league clubs are not in it */
export const teamsById: ReadonlyMap<number, TeamMeta> = new Map(teamsData.map((t) => [t.id, t]));

/**
 * A club's name in the UI language. Only big league clubs have a Chinese
 * name; anything else (a minor league club, an unknown id) falls back to the
 * name the API gave.
 */
export function teamDisplayName(id: number | undefined, lang: Language, fallback?: string): string | undefined {
  const meta = id !== undefined ? teamsById.get(id) : undefined;
  return (lang === 'zh' ? meta?.nameZh : meta?.name) || fallback;
}
