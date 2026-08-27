import React from 'react';
import { useGameBoxscoreQuery } from '../../services/queries';
import { useLanguage } from '../../hooks/useLanguage';
import { Loader2 } from 'lucide-react';

interface GameBoxscorePanelProps {
  gamePk: number;
}

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

  const renderBatters = (teamBox: any, title: string) => {
    const batterIds: number[] = teamBox.batters || [];
    const players = teamBox.players || {};

    return (
      <div className="space-y-2">
        <div className="font-bold text-xs text-main border-b border-border/40 pb-1 flex justify-between items-center">
          <span>{title} - {t('team.boxscore_batting')}</span>
          <span className="text-[10px] text-muted font-mono">
            {teamBox.teamStats?.batting?.hits ?? 0} H &bull; {teamBox.teamStats?.batting?.homeRuns ?? 0} HR &bull; {teamBox.teamStats?.batting?.rbi ?? 0} RBI
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono text-left">
            <thead>
              <tr className="text-muted border-b border-border/30 text-[10px]">
                <th className="py-1 font-medium">{lang === 'zh' ? '打者' : 'Batter'}</th>
                <th className="py-1 text-center font-medium">AB</th>
                <th className="py-1 text-center font-medium">R</th>
                <th className="py-1 text-center font-medium">H</th>
                <th className="py-1 text-center font-medium">RBI</th>
                <th className="py-1 text-center font-medium">BB</th>
                <th className="py-1 text-center font-medium">SO</th>
                <th className="py-1 text-right font-medium">AVG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {batterIds.slice(0, 10).map((bId) => {
                const p = players['ID' + bId];
                if (!p) return null;
                const s = p.stats?.batting;
                if (!s || s.atBats === undefined) return null;

                return (
                  <tr key={bId} className="hover:bg-card-hover/40">
                    <td className="py-1 font-sans font-medium text-main truncate max-w-[120px]">
                      {p.person?.fullName}
                      <span className="text-[9px] text-muted ml-1 font-mono">
                        {p.position?.abbreviation}
                      </span>
                    </td>
                    <td className="py-1 text-center">{s.atBats}</td>
                    <td className="py-1 text-center">{s.runs}</td>
                    <td className="py-1 text-center font-bold text-team-primary">{s.hits}</td>
                    <td className="py-1 text-center">{s.rbi}</td>
                    <td className="py-1 text-center">{s.baseOnBalls}</td>
                    <td className="py-1 text-center">{s.strikeOuts}</td>
                    <td className="py-1 text-right text-muted">{s.avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPitchers = (teamBox: any, title: string) => {
    const pitcherIds: number[] = teamBox.pitchers || [];
    const players = teamBox.players || {};

    return (
      <div className="space-y-2">
        <div className="font-bold text-xs text-main border-b border-border/40 pb-1 flex justify-between items-center">
          <span>{title} - {t('team.boxscore_pitching')}</span>
          <span className="text-[10px] text-muted font-mono">
            {teamBox.teamStats?.pitching?.inningsPitched ?? '0.0'} IP &bull; {teamBox.teamStats?.pitching?.strikeOuts ?? 0} K &bull; {teamBox.teamStats?.pitching?.era ?? '0.00'} ERA
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono text-left">
            <thead>
              <tr className="text-muted border-b border-border/30 text-[10px]">
                <th className="py-1 font-medium">{lang === 'zh' ? '投手' : 'Pitcher'}</th>
                <th className="py-1 text-center font-medium">IP</th>
                <th className="py-1 text-center font-medium">H</th>
                <th className="py-1 text-center font-medium">R</th>
                <th className="py-1 text-center font-medium">ER</th>
                <th className="py-1 text-center font-medium">BB</th>
                <th className="py-1 text-center font-medium">SO</th>
                <th className="py-1 text-right font-medium">ERA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {pitcherIds.map((pId) => {
                const p = players['ID' + pId];
                if (!p) return null;
                const s = p.stats?.pitching;
                if (!s || s.inningsPitched === undefined) return null;

                return (
                  <tr key={pId} className="hover:bg-card-hover/40">
                    <td className="py-1 font-sans font-medium text-main truncate max-w-[120px]">
                      {p.person?.fullName}
                    </td>
                    <td className="py-1 text-center font-semibold">{s.inningsPitched}</td>
                    <td className="py-1 text-center">{s.hits}</td>
                    <td className="py-1 text-center">{s.runs}</td>
                    <td className="py-1 text-center">{s.earnedRuns}</td>
                    <td className="py-1 text-center">{s.baseOnBalls}</td>
                    <td className="py-1 text-center font-bold text-team-primary">{s.strikeOuts}</td>
                    <td className="py-1 text-right text-muted">{s.era}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50 bg-page/50 p-4 rounded-xl space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderBatters(away, away.team?.name || 'Away')}
        {renderBatters(home, home.team?.name || 'Home')}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderPitchers(away, away.team?.name || 'Away')}
        {renderPitchers(home, home.team?.name || 'Home')}
      </div>
    </div>
  );
};
