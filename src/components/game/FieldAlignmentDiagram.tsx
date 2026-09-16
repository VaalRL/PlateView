import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { BoxscoreTeamSide, VenueFieldInfo } from '../../types/mlb';
import {
  buildFencePoints,
  buildFencePath,
  fenceRadiusAt,
  fenceDistanceLabel,
  polarToSvg,
} from '../../utils/ballpark';
import {
  FIELD_POSITIONS,
  FieldPosition,
  Fielder,
  LineupEntry,
  buildFieldAlignment,
  findDesignatedHitter,
} from '../../utils/lineup';

interface FieldAlignmentDiagramProps {
  teamBox: BoxscoreTeamSide;
  teamName: string;
  /** Highlighted with a pulsing ring, e.g. the pitcher currently on the mound */
  highlightPersonId?: number;
  /** Published fence distances; without them the chart draws a generic arc */
  fieldInfo?: VenueFieldInfo;
  venueName?: string;
}

/**
 * Ballpark geometry inside the 400x400 viewBox, drawn as a TV centre-field
 * shot. Home plate sits at (200, 318); the outfield arc is 250 units out and
 * the skinned infield 140, so the bases land on dirt like a real diamond.
 */
const HOME = { x: 200, y: 318 };
const BASES = [
  { x: 266, y: 250 }, // 1B
  { x: 200, y: 184 }, // 2B
  { x: 134, y: 250 }, // 3B
];
const MOUND = { x: 200, y: 250 };

const FENCE_RADIUS = 250;
/** Outfielders play in front of the wall, not on it */
const OUTFIELD_DEPTH = 0.82;
/**
 * The infield is drawn larger than scale so the names stay readable, which
 * leaves a short porch too little room: without a floor, a 302-foot corner
 * pushes its fielder onto the shortstop.
 */
const MIN_OUTFIELD_RADIUS = 172;
/** Angles from straight-away centre for the three outfielders */
const OUTFIELD_ANGLES: Record<'LF' | 'CF' | 'RF', number> = { LF: -32, CF: 0, RF: 32 };

/** Node centres, offset from their base so the marker and the name stay clear */
const NODE_COORDS: Record<FieldPosition, { x: number; y: number }> = {
  P: { x: 200, y: 250 },
  C: { x: 200, y: 344 },
  '1B': { x: 288, y: 236 },
  '2B': { x: 246, y: 192 },
  SS: { x: 154, y: 192 },
  '3B': { x: 112, y: 236 },
  LF: { x: 94, y: 152 },
  CF: { x: 200, y: 122 },
  RF: { x: 306, y: 152 },
};

/** Short surname-style label; SVG has no ellipsis so the text is trimmed here */
function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || '';
  return last.length > 12 ? `${last.slice(0, 11)}.` : last;
}

const PositionNode: React.FC<{
  position: FieldPosition;
  fielder?: Fielder;
  isHighlighted: boolean;
  centre: { x: number; y: number };
}> = ({ position, fielder, isHighlighted, centre }) => {
  const { t } = useLanguage();
  const { x, y } = centre;

  const node = (
    <g>
      {isHighlighted && (
        <circle
          cx={x}
          cy={y}
          r={21}
          className="fill-team-primary animate-pulse"
          fillOpacity={0.25}
        />
      )}
      <circle
        cx={x}
        cy={y}
        r={14}
        className={
          fielder
            ? fielder.isPending
              ? 'fill-team-primary stroke-team-primary'
              : 'fill-team-primary stroke-card'
            : 'fill-transparent stroke-border'
        }
        fillOpacity={fielder?.isPending ? 0.45 : undefined}
        strokeWidth={2}
        strokeDasharray={fielder?.isPending ? '3 2' : undefined}
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        className={`text-[12px] font-bold ${fielder ? 'fill-white' : 'fill-muted'}`}
      >
        {fielder?.positionNumber ?? ''}
      </text>
      {fielder?.battingSlot != null && (
        <g>
          <circle
            cx={x + 14}
            cy={y - 13}
            r={8}
            className="fill-card stroke-border"
            strokeWidth={1.5}
          />
          <text
            x={x + 14}
            y={y - 10}
            textAnchor="middle"
            className="text-[9px] font-bold fill-main"
          >
            {fielder.battingSlot}
          </text>
        </g>
      )}
      <text x={x} y={y + 28} textAnchor="middle" className="text-[10px] font-bold fill-muted">
        {position}
      </text>
      {fielder && (
        <text x={x} y={y + 40} textAnchor="middle" className="text-[11px] fill-main">
          {shortName(fielder.fullName)}
          {fielder.isSubstitute ? ' *' : ''}
        </text>
      )}
    </g>
  );

  if (!fielder) return node;

  return (
    <a href={`#/players/${fielder.personId}`} aria-label={`${position} ${fielder.fullName}`}>
      <title>
        {`${fielder.positionNumber} ${position} — ${fielder.fullName}` +
          (fielder.battingSlot != null
            ? ` · ${t('game.batting_slot', { slot: fielder.battingSlot })}`
            : '') +
          (fielder.replacedName ? ` (${t('game.replaced_prefix')}${fielder.replacedName})` : '') +
          (fielder.isPending ? ` — ${t('game.position_pending')}` : '')}
      </title>
      {node}
    </a>
  );
};

/**
 * Who is standing where, drawn as the nine scorekeeping positions on a diamond.
 *
 * This is a position chart, not a Statcast shift chart: MLB's public Stats API
 * exposes which position each fielder holds, never their tracked coordinates.
 */
export const FieldAlignmentDiagram: React.FC<FieldAlignmentDiagramProps> = ({
  teamBox,
  teamName,
  highlightPersonId,
  fieldInfo,
  venueName,
}) => {
  const { lang, t } = useLanguage();
  const alignment = buildFieldAlignment(teamBox);
  const dh: LineupEntry | null = findDesignatedHitter(teamBox);
  const filled = FIELD_POSITIONS.filter((pos) => alignment[pos]);

  // A venue with published dimensions gets its own outfield wall; anything
  // missing or malformed falls back to the generic arc rather than breaking
  const fence = buildFencePoints(fieldInfo, FENCE_RADIUS);
  const fencePath = fence ? buildFencePath(HOME, fence) : null;

  /**
   * Outfielders stand a fixed fraction in front of the wall, so a short porch
   * pulls its fielder in. Without dimensions they keep their default spots.
   */
  const nodeCentre = (position: FieldPosition) => {
    if (!fence || !(position in OUTFIELD_ANGLES)) return NODE_COORDS[position];
    const angle = OUTFIELD_ANGLES[position as keyof typeof OUTFIELD_ANGLES];
    const depth = Math.max(fenceRadiusAt(fence, angle) * OUTFIELD_DEPTH, MIN_OUTFIELD_RADIUS);
    return polarToSvg(HOME, angle, depth);
  };

  if (filled.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted">{t('game.alignment_empty')}</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-main">{teamName}</h3>
        <span className="text-[10px] text-muted">{t('game.alignment_note')}</span>
      </div>

      {fence && (
        <div className="flex flex-wrap items-baseline gap-x-2 text-[10px] text-muted">
          {venueName && <span className="font-semibold text-main">{venueName}</span>}
          <span className="font-mono">{fenceDistanceLabel(fence)}</span>
          <span>{t('game.fence_note')}</span>
        </div>
      )}

      <svg
        viewBox="0 0 400 400"
        role="img"
        aria-label={`${teamName} ${t('game.alignment_title')}`}
        className="w-full h-auto"
      >
        {/* Outfield grass, bounded by the foul lines and the outfield wall */}
        <path
          d={
            fencePath
              ? `M ${HOME.x} ${HOME.y} ${fencePath.replace('M', 'L')} Z`
              : `M ${HOME.x} ${HOME.y} L 23 141 A 250 250 0 0 1 377 141 Z`
          }
          className="fill-field-grass stroke-border"
          strokeWidth={1.5}
        />
        {/* Warning track hugging the wall */}
        <path
          d={fencePath ?? 'M 23 141 A 250 250 0 0 1 377 141'}
          className="stroke-field-dirt"
          fill="none"
          strokeWidth={9}
        />
        {/* Skinned infield */}
        <path
          d={`M ${HOME.x} ${HOME.y} L 101 219 A 140 140 0 0 1 299 219 Z`}
          className="fill-field-dirt"
        />
        {/* Infield grass inside the base paths */}
        <path
          d="M 200 304 L 252 250 L 200 196 L 148 250 Z"
          className="fill-field-infield"
        />
        {/* Foul lines */}
        {([-45, 45] as const).map((angle) => {
          const end = polarToSvg(
            HOME,
            angle,
            fence ? fenceRadiusAt(fence, angle) : FENCE_RADIUS
          );
          return (
            <line
              key={angle}
              x1={HOME.x}
              y1={HOME.y}
              x2={end.x}
              y2={end.y}
              className="stroke-field-line"
              strokeWidth={1.5}
            />
          );
        })}
        {/* Pitcher's mound, bases and home plate */}
        <circle cx={MOUND.x} cy={MOUND.y} r={11} className="fill-field-dirt" />
        {BASES.map((base) => (
          <rect
            key={`${base.x}-${base.y}`}
            x={base.x - 5}
            y={base.y - 5}
            width={10}
            height={10}
            transform={`rotate(45 ${base.x} ${base.y})`}
            className="fill-field-line stroke-border"
            strokeWidth={0.75}
          />
        ))}
        <path
          d={`M ${HOME.x - 6} ${HOME.y - 6} L ${HOME.x + 6} ${HOME.y - 6} L ${HOME.x + 6} ${
            HOME.y + 2
          } L ${HOME.x} ${HOME.y + 8} L ${HOME.x - 6} ${HOME.y + 2} Z`}
          className="fill-field-line stroke-border"
          strokeWidth={0.75}
        />

        {FIELD_POSITIONS.map((pos) => (
          <PositionNode
            key={pos}
            position={pos}
            fielder={alignment[pos]}
            isHighlighted={!!highlightPersonId && alignment[pos]?.personId === highlightPersonId}
            centre={nodeCentre(pos)}
          />
        ))}
      </svg>

      {/* Narrow screens get the same data as a list; the diagram alone is too dense */}
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-[11px]">
        {filled.map((pos) => {
          const f = alignment[pos]!;
          return (
            <li key={pos} className="flex items-center gap-1.5 min-w-0">
              <span className="w-4 h-4 shrink-0 rounded-full bg-team-primary text-white font-mono text-[9px] flex items-center justify-center">
                {f.positionNumber}
              </span>
              <span className="font-mono text-muted w-6 shrink-0">{pos}</span>
              {f.battingSlot != null && (
                <span className="shrink-0 text-[9px] font-bold text-team-primary font-mono">
                  {f.battingSlot}
                </span>
              )}
              <a
                href={`#/players/${f.personId}`}
                className="truncate text-main hover:text-team-primary hover:underline"
              >
                {f.fullName}
              </a>
              {f.isSubstitute && <span className="text-[9px] text-amber-500 shrink-0">*</span>}
              {f.isPending && (
                <span className="text-[9px] text-team-primary shrink-0">
                  {t('game.position_pending')}
                </span>
              )}
            </li>
          );
        })}
        {dh && (
          <li className="flex items-center gap-1.5 min-w-0">
            <span className="w-4 h-4 shrink-0 rounded-full bg-muted/30 text-main font-mono text-[9px] flex items-center justify-center">
              {lang === 'zh' ? '指' : 'D'}
            </span>
            <span className="font-mono text-muted w-6 shrink-0">DH</span>
            <a
              href={`#/players/${dh.personId}`}
              className="truncate text-main hover:text-team-primary hover:underline"
            >
              {dh.fullName}
            </a>
          </li>
        )}
      </ul>
    </div>
  );
};
