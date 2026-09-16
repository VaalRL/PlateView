import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { BoxscoreTeamSide } from '../../types/mlb';
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
}

/** Node centres inside the 400x360 viewBox, laid out like a TV centre-field shot */
const NODE_COORDS: Record<FieldPosition, { x: number; y: number }> = {
  P: { x: 200, y: 214 },
  C: { x: 200, y: 322 },
  '1B': { x: 278, y: 222 },
  '2B': { x: 244, y: 168 },
  SS: { x: 156, y: 168 },
  '3B': { x: 122, y: 222 },
  LF: { x: 74, y: 104 },
  CF: { x: 200, y: 62 },
  RF: { x: 326, y: 104 },
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
}> = ({ position, fielder, isHighlighted }) => {
  const { t } = useLanguage();
  const { x, y } = NODE_COORDS[position];

  const node = (
    <g>
      {isHighlighted && (
        <circle cx={x} cy={y} r={20} className="fill-team-primary/20 animate-pulse" />
      )}
      <circle
        cx={x}
        cy={y}
        r={14}
        className={
          fielder
            ? fielder.isPending
              ? 'fill-team-primary/40 stroke-team-primary'
              : 'fill-team-primary stroke-card'
            : 'fill-transparent stroke-border'
        }
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
}) => {
  const { lang, t } = useLanguage();
  const alignment = buildFieldAlignment(teamBox);
  const dh: LineupEntry | null = findDesignatedHitter(teamBox);
  const filled = FIELD_POSITIONS.filter((pos) => alignment[pos]);

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

      <svg
        viewBox="0 0 400 360"
        role="img"
        aria-label={`${teamName} ${t('game.alignment_title')}`}
        className="w-full h-auto"
      >
        {/* Outfield grass, infield dirt and foul lines */}
        <path
          d="M 200 320 L 20 140 A 255 255 0 0 1 380 140 Z"
          className="fill-team-primary/5 stroke-border"
          strokeWidth={1.5}
        />
        <path
          d="M 200 320 L 128 248 L 200 176 L 272 248 Z"
          className="fill-team-primary/10 stroke-border"
          strokeWidth={1.5}
        />
        <line x1={200} y1={320} x2={44} y2={164} className="stroke-border" strokeWidth={1} />
        <line x1={200} y1={320} x2={356} y2={164} className="stroke-border" strokeWidth={1} />

        {FIELD_POSITIONS.map((pos) => (
          <PositionNode
            key={pos}
            position={pos}
            fielder={alignment[pos]}
            isHighlighted={!!highlightPersonId && alignment[pos]?.personId === highlightPersonId}
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
              <a
                href={`#/players/${f.personId}`}
                className="truncate text-main hover:text-team-primary hover:underline"
              >
                {f.fullName}
              </a>
              {f.isSubstitute && <span className="text-[9px] text-amber-500 shrink-0">*</span>}
              {f.replacedName && (
                <span className="text-[9px] text-muted truncate shrink-0">
                  {t('game.replaced_prefix')}
                  {f.replacedName}
                </span>
              )}
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
