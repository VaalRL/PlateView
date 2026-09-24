/**
 * Number of games each MLB team plays in a regular season. Shared by the
 * standings table and team page so the season-progress denominator lives in
 * one place (it has changed before, e.g. the 60-game 2020 season).
 */
export const MLB_REGULAR_SEASON_GAMES = 162;

/**
 * Earliest season the postseason bracket offers. From 2012 on every bracket
 * opens with a wild card round and seeds can be derived from the standings
 * (see docs/adr/0004-postseason-bracket.md).
 */
export const POSTSEASON_FIRST_SEASON = 2012;
