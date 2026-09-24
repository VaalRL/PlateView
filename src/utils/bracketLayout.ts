import type {
  BracketLeague,
  BracketRound,
  BracketSeries,
  BracketTeam,
  PostseasonBracket,
} from './postseason';

/**
 * Coordinates for the postseason bracket drawing (docs/adr/0004): one tile per
 * team per series, AL growing leftwards from the World Series and the NL
 * mirrored to the right. Units are SVG user units; the drawing scales with its
 * container through the viewBox.
 */

/** Horizontal distance between round columns */
export const COLUMN_GAP = 118;
/** Vertical space per tile that does not come out of an earlier series */
export const ROW_HEIGHT = 78;
/** Distance from the center to each World Series tile */
const WORLD_SERIES_OFFSET = 72;
/** Room above the tiles for the title and round names, and below for series lengths */
const TOP = 132;
const BOTTOM = 64;
const SIDE = 56;

export interface SlotTile {
  key: string;
  seriesId: string;
  team: BracketTeam;
  x: number;
  y: number;
  /** Lost this series */
  eliminated: boolean;
}

export interface SeriesMarker {
  series: BracketSeries;
  /** Where the series' two lines meet */
  x: number;
  y: number;
}

export interface ColumnInfo {
  x: number;
  round: BracketRound;
  league: BracketLeague | null;
  bestOf: number;
}

export interface BracketLayout {
  width: number;
  height: number;
  slots: SlotTile[];
  /** SVG path data for the connector lines */
  lines: string[];
  markers: SeriesMarker[];
  columns: ColumnInfo[];
  champion: { x: number; y: number; team: BracketTeam | null };
}

interface SlotAssignment {
  team: BracketTeam;
  feeder: BracketSeries | null;
}

const byIdDesc = (a: BracketSeries, b: BracketSeries) =>
  b.id.localeCompare(a.id, undefined, { numeric: true });

/**
 * Which earlier series each of a series' two teams came through. A feeder's
 * winner is matched by team; one still undecided takes a placeholder slot.
 * Teams that came through a series are drawn first (above a bye, as MLB's own
 * bracket does), and a first-round matchup lists the road team first.
 */
function assignSlots(series: BracketSeries, feeders: BracketSeries[]): SlotAssignment[] {
  const slots: SlotAssignment[] = [series.bottom, series.top].map((team) => ({ team, feeder: null }));
  const unmatched: BracketSeries[] = [];
  [...feeders].sort(byIdDesc).forEach((f) => {
    const slot = slots.find((s) => !s.feeder && f.winnerId !== null && s.team.id === f.winnerId);
    if (slot) slot.feeder = f;
    else unmatched.push(f);
  });
  unmatched.forEach((f) => {
    const slot = slots.find((s) => !s.feeder && s.team.isPlaceholder) ?? slots.find((s) => !s.feeder);
    if (slot) slot.feeder = f;
  });

  const fed = slots
    .filter((s) => s.feeder)
    .sort((a, b) => byIdDesc(a.feeder!, b.feeder!));
  return [...fed, ...slots.filter((s) => !s.feeder)];
}

const isEliminated = (series: BracketSeries, team: BracketTeam) =>
  series.winnerId !== null && series.winnerId !== team.id;

export function layoutBracket(bracket: PostseasonBracket): BracketLayout {
  const slots: SlotTile[] = [];
  const lines: string[] = [];
  const markers: SeriesMarker[] = [];
  const columnMap = new Map<string, ColumnInfo>();

  // Depth: 0 = World Series tile, 1 = championship series, 2 = division, 3 = wild card
  const depthOf = (league: BracketLeague) => {
    let depth = 0;
    const walk = (s: BracketSeries | null, d: number) => {
      if (!s) return;
      depth = Math.max(depth, d);
      s.feeders.forEach((f) => walk(f, d + 1));
    };
    walk(bracket[league], 1);
    return depth;
  };
  const maxDepth = Math.max(depthOf('AL'), depthOf('NL'), 1);
  const width = 2 * (SIDE + WORLD_SERIES_OFFSET + maxDepth * COLUMN_GAP);
  const center = width / 2;
  const xAt = (league: BracketLeague, depth: number) => {
    const offset = WORLD_SERIES_OFFSET + depth * COLUMN_GAP;
    return league === 'AL' ? center - offset : center + offset;
  };

  const leafCount: Record<BracketLeague, number> = { AL: 0, NL: 0 };

  /** Lay out a series and everything that fed it; returns the y its winner leaves at */
  const place = (series: BracketSeries, league: BracketLeague, depth: number): number => {
    const x = xAt(league, depth);
    const assigned = assignSlots(series, series.feeders);
    const ys = assigned.map(({ feeder }) =>
      feeder ? place(feeder, league, depth + 1) : TOP + (leafCount[league]++ + 0.5) * ROW_HEIGHT
    );
    assigned.forEach(({ team }, i) =>
      slots.push({ key: `${series.id}-${team.id}`, seriesId: series.id, team, x, y: ys[i], eliminated: isEliminated(series, team) })
    );

    // Elbow: each tile runs toward the next round, the two meet, and one line
    // carries on into the tile the winner takes
    const next = xAt(league, depth - 1);
    const join = (x + next) / 2;
    const out = (Math.min(...ys) + Math.max(...ys)) / 2;
    ys.forEach((y) => lines.push(`M ${x} ${y} H ${join}`));
    lines.push(`M ${join} ${Math.min(...ys)} V ${Math.max(...ys)}`);
    lines.push(`M ${join} ${out} H ${next}`);
    markers.push({ series, x: join, y: out });

    const key = `${league}-${depth}`;
    if (!columnMap.has(key)) columnMap.set(key, { x, round: series.round, league, bestOf: series.bestOf });
    return out;
  };

  const rootY: Partial<Record<BracketLeague, number>> = {};
  (['AL', 'NL'] as const).forEach((league) => {
    const root = bracket[league];
    if (root) rootY[league] = place(root, league, 1);
  });

  const rows = Math.max(leafCount.AL, leafCount.NL, 2);
  const height = TOP + rows * ROW_HEIGHT + BOTTOM;
  const middle = TOP + (rows * ROW_HEIGHT) / 2;

  // World Series: one tile per league champion, joined in the center and up
  // into the champion's tile
  const ws = bracket.worldSeries;
  const alY = rootY.AL ?? middle;
  const nlY = rootY.NL ?? middle;
  const wsY = (alY + nlY) / 2;
  const championY = wsY - ROW_HEIGHT * 1.6;
  if (ws) {
    const leagueRoots = (['AL', 'NL'] as const).map((l) => bracket[l]).filter((s): s is BracketSeries => !!s);
    const assigned = assignSlots(ws, leagueRoots);
    (['AL', 'NL'] as const).forEach((league) => {
      const root = bracket[league];
      const slot = assigned.find((a) => a.feeder === root) ?? assigned[league === 'AL' ? 0 : 1];
      const x = xAt(league, 0);
      const y = league === 'AL' ? alY : nlY;
      slots.push({ key: `${ws.id}-${slot.team.id}`, seriesId: ws.id, team: slot.team, x, y, eliminated: isEliminated(ws, slot.team) });
      lines.push(`M ${x} ${y} H ${center}`);
    });
    lines.push(`M ${center} ${Math.min(alY, nlY)} V ${Math.max(alY, nlY)}`);
    lines.push(`M ${center} ${wsY} V ${championY}`);
    markers.push({ series: ws, x: center, y: wsY });
    columnMap.set('W', { x: center, round: 'W', league: null, bestOf: ws.bestOf });
  }

  const championTeam = ws?.winnerId ? [ws.top, ws.bottom].find((t) => t.id === ws.winnerId) ?? null : null;

  // Columns outward from the center: AL wild card first, NL last
  const columns = [...columnMap.values()].sort((a, b) => a.x - b.x);

  return {
    width,
    height,
    slots,
    lines,
    markers,
    columns,
    champion: { x: center, y: championY, team: championTeam },
  };
}
