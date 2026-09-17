/**
 * Accent for a game that is currently being played.
 *
 * Deliberately amber, not red: a loss is marked in rose and a win in emerald
 * across the app, and red-500 sits close enough to rose-500 that a live game
 * read as a defeat. Amber is the one of the three that means neither.
 */
export const LIVE_ACCENT = {
  /** Card outline and glow for a live game */
  card: 'border-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.14)] ring-1 ring-amber-500/30',
  /** Pill badge, e.g. the LIVE tag */
  badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
  /** Solid marker dot */
  dot: 'bg-amber-500',
  /** Inline text, e.g. the current inning */
  text: 'text-amber-600 dark:text-amber-400',
} as const;
