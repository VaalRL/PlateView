import React from 'react';
import { Link } from 'react-router-dom';
import { useGameBoxscoreQuery } from '../../services/queries';
import { useLanguage } from '../../hooks/useLanguage';
import { BattingTable, PitchingTable } from '../game/BoxscoreTables';
import { Loader2, Maximize2 } from 'lucide-react';

interface GameBoxscorePanelProps {
  gamePk: number;
}

/** Rows shown inline; the full list lives on the game detail page */
const INLINE_BATTER_LIMIT = 12;

export const GameBoxscorePanel: React.FC<GameBoxscorePanelProps> = ({ gamePk }) => {
  const { data, isLoading, isError } = useGameBoxscoreQuery(gamePk);
  const { lang, t } = useLanguage();

  if (isLoading) {
    return (
      <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted">
        <Loader2 className="w-4 h-4 animate-spin text-team-primary" />
        <span>{lang === 'zh' ? '正在載入比賽完整 Box 數據...' : 'Loading game box score...'}</span>
      </div>
    );
  }

  if (isError || !data?.teams) {
    return (
      <div className="py-4 text-center text-xs text-muted">
        {lang === 'zh' ? '暫無詳細 Box 數據' : 'Box score data not available.'}
      </div>
    );
  }

  const { away, home } = data.teams;
  const awayName = away.team?.name || 'Away';
  const homeName = home.team?.name || 'Home';

  return (
    <div className="mt-3 pt-3 border-t border-border/50 bg-page/50 p-4 rounded-xl space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BattingTable teamBox={away} title={awayName} limit={INLINE_BATTER_LIMIT} />
        <BattingTable teamBox={home} title={homeName} limit={INLINE_BATTER_LIMIT} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PitchingTable teamBox={away} title={awayName} />
        <PitchingTable teamBox={home} title={homeName} />
      </div>

      {/* Lineups, defensive alignment and the untruncated tables live on the page */}
      <div className="flex justify-center pt-1">
        <Link
          to={`/games/${gamePk}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-team-primary hover:underline"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{t('game.open_full_box')}</span>
        </Link>
      </div>
    </div>
  );
};
