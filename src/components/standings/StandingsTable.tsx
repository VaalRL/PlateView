import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStandingsQuery } from '../../services/queries';
import { getTeamLogoUrl } from '../../services/mlbApi';
import { StandingRecord } from '../../types/mlb';
import { useLanguage } from '../../hooks/useLanguage';
import teamsData from '../../data/teams.json';

type StandingsTab = 'ALL' | 'AL' | 'NL' | 'WC';

export const StandingsTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StandingsTab>('ALL');
  const { data, isLoading, isError } = useStandingsQuery();
  const { lang, t } = useLanguage();

  const divisionNameMap: Record<number, { zh: string; en: string }> = {
    201: { zh: '美聯東區 (AL East)', en: 'AL East' },
    202: { zh: '美聯中區 (AL Central)', en: 'AL Central' },
    200: { zh: '美聯西區 (AL West)', en: 'AL West' },
    204: { zh: '國聯東區 (NL East)', en: 'NL East' },
    205: { zh: '國聯中區 (NL Central)', en: 'NL Central' },
    203: { zh: '國聯西區 (NL West)', en: 'NL West' },
  };

  const records = data?.records || [];

  const filteredRecords = records.filter((r) => {
    const divId = r.division.id;
    if (activeTab === 'AL') return [201, 202, 200].includes(divId);
    if (activeTab === 'NL') return [204, 205, 203].includes(divId);
    return true;
  });

  // Helper: Extract all records for a league (103 = AL, 104 = NL)
  const getLeagueWildCardTeams = (leagueType: 'AL' | 'NL'): StandingRecord[] => {
    const divIds = leagueType === 'AL' ? [201, 202, 200] : [204, 205, 203];
    const allTeams: StandingRecord[] = [];

    records.forEach((div) => {
      if (divIds.includes(div.division.id)) {
        div.teamRecords.forEach((tr) => {
          allTeams.push(tr);
        });
      }
    });

    // Sort by winning percentage descending
    return allTeams.sort((a, b) => {
      const pctA = parseFloat(a.winningPercentage) || 0;
      const pctB = parseFloat(b.winningPercentage) || 0;
      return pctB - pctA;
    });
  };

  const alWildCard = getLeagueWildCardTeams('AL');
  const nlWildCard = getLeagueWildCardTeams('NL');

  return (
    <section id="standings" className="mt-12 space-y-6">
      {/* Header and Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
        <div>
          <h2 className="text-xl font-extrabold text-main tracking-tight">
            {t('standings.title')}
          </h2>
          <p className="text-xs text-muted mt-0.5">{t('standings.subtitle')}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-1 bg-card border border-border rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'ALL' ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
            }`}
          >
            {t('standings.tab_all')}
          </button>
          <button
            onClick={() => setActiveTab('AL')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'AL' ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
            }`}
          >
            {t('standings.tab_al')}
          </button>
          <button
            onClick={() => setActiveTab('NL')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'NL' ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
            }`}
          >
            {t('standings.tab_nl')}
          </button>
          <button
            onClick={() => setActiveTab('WC')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'WC' ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
            }`}
          >
            {t('standings.tab_wc')}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-64 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-rose-500 text-sm">
          {t('standings.load_error')}
        </div>
      )}

      {/* Wild Card View */}
      {!isLoading && !isError && activeTab === 'WC' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AL Wild Card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-page/80 border-b border-border px-4 py-3 font-bold text-xs text-team-primary flex items-center justify-between">
              <span>{t('standings.al_header')}</span>
              <span className="text-[11px] text-muted font-normal">{t('standings.wc_hint')}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/50 text-muted text-[11px] bg-page/30">
                    <th className="py-2.5 px-3 font-medium">{t('standings.rank')}</th>
                    <th className="py-2.5 px-3 font-medium">{t('standings.team')}</th>
                    <th className="py-2.5 px-2 text-center font-medium">{t('standings.wins')}</th>
                    <th className="py-2.5 px-2 text-center font-medium">{t('standings.losses')}</th>
                    <th className="py-2.5 px-2 text-center font-medium">{t('standings.pct')}</th>
                    <th className="py-2.5 px-2 text-center font-medium">{t('standings.wcgb')}</th>
                    <th className="py-2.5 px-2 text-center font-medium">{t('standings.enum')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {alWildCard.map((rec, idx) => {
                    const teamMeta = teamsData.find((t) => t.id === rec.team.id);
                    const teamDisplayName =
                      lang === 'zh' ? teamMeta?.nameZh || rec.team.name : teamMeta?.name || rec.team.name;
                    const isDivLeader = rec.divisionRank === '1';
                    const isWildCardSpot = !isDivLeader && idx < 6;

                    return (
                      <tr
                        key={rec.team.id}
                        className={`hover:bg-card-hover/50 transition-colors ${
                          idx === 5 ? 'border-b-2 border-dashed border-emerald-500/60' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-mono font-bold text-[11px]">
                          {isDivLeader ? (
                            <span className="px-1.5 py-0.5 rounded bg-team-primary/20 text-team-primary text-[10px]">
                              {t('standings.div_leader')}
                            </span>
                          ) : (
                            <span className="text-muted">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 flex items-center gap-2">
                          <img
                            src={getTeamLogoUrl(rec.team.id)}
                            alt={teamDisplayName}
                            className="w-4 h-4 object-contain"
                          />
                          <Link
                            to={`/teams/${rec.team.id}`}
                            className={`font-semibold hover:text-team-primary truncate max-w-[120px] ${
                              isWildCardSpot ? 'text-emerald-400 font-bold' : 'text-main'
                            }`}
                          >
                            {teamDisplayName}
                          </Link>
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-medium">{rec.wins}</td>
                        <td className="py-2 px-2 text-center font-mono text-muted">{rec.losses}</td>
                        <td className="py-2 px-2 text-center font-mono">{rec.winningPercentage}</td>
                        <td className="py-2 px-2 text-center font-mono font-medium">
                          {rec.wildCardGamesBack || '-'}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-muted text-[11px]">
                          {rec.wildCardEliminationNumber || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* NL Wild Card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-page/80 border-b border-border px-4 py-3 font-bold text-xs text-team-primary flex items-center justify-between">
              <span>{t('standings.nl_header')}</span>
              <span className="text-[11px] text-muted font-normal">{t('standings.wc_hint')}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/50 text-muted text-[11px] bg-page/30">
                    <th className="py-2.5 px-3 font-medium">{t('standings.rank')}</th>
                    <th className="py-2.5 px-3 font-medium">{t('standings.team')}</th>
                    <th className="py-2.5 px-2 text-center font-medium">{t('standings.wins')}</th>
                    <th className="py-2.5 px-2 text-center font-medium">{t('standings.losses')}</th>
                    <th className="py-2.5 px-2 text-center font-medium">{t('standings.pct')}</th>
                    <th className="py-2.5 px-2 text-center font-medium">{t('standings.wcgb')}</th>
                    <th className="py-2.5 px-2 text-center font-medium">{t('standings.enum')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {nlWildCard.map((rec, idx) => {
                    const teamMeta = teamsData.find((t) => t.id === rec.team.id);
                    const teamDisplayName =
                      lang === 'zh' ? teamMeta?.nameZh || rec.team.name : teamMeta?.name || rec.team.name;
                    const isDivLeader = rec.divisionRank === '1';
                    const isWildCardSpot = !isDivLeader && idx < 6;

                    return (
                      <tr
                        key={rec.team.id}
                        className={`hover:bg-card-hover/50 transition-colors ${
                          idx === 5 ? 'border-b-2 border-dashed border-emerald-500/60' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-mono font-bold text-[11px]">
                          {isDivLeader ? (
                            <span className="px-1.5 py-0.5 rounded bg-team-primary/20 text-team-primary text-[10px]">
                              {t('standings.div_leader')}
                            </span>
                          ) : (
                            <span className="text-muted">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 flex items-center gap-2">
                          <img
                            src={getTeamLogoUrl(rec.team.id)}
                            alt={teamDisplayName}
                            className="w-4 h-4 object-contain"
                          />
                          <Link
                            to={`/teams/${rec.team.id}`}
                            className={`font-semibold hover:text-team-primary truncate max-w-[120px] ${
                              isWildCardSpot ? 'text-emerald-400 font-bold' : 'text-main'
                            }`}
                          >
                            {teamDisplayName}
                          </Link>
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-medium">{rec.wins}</td>
                        <td className="py-2 px-2 text-center font-mono text-muted">{rec.losses}</td>
                        <td className="py-2 px-2 text-center font-mono">{rec.winningPercentage}</td>
                        <td className="py-2 px-2 text-center font-mono font-medium">
                          {rec.wildCardGamesBack || '-'}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-muted text-[11px]">
                          {rec.wildCardEliminationNumber || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Divisional View (ALL / AL / NL) */}
      {!isLoading && !isError && activeTab !== 'WC' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((divisionGroup) => {
            const divInfo = divisionNameMap[divisionGroup.division.id];
            const divTitle = divInfo ? divInfo[lang] : divisionGroup.division.name;

            return (
              <div
                key={divisionGroup.division.id}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col"
              >
                <div className="bg-page/60 border-b border-border px-4 py-2.5 font-bold text-xs text-team-primary flex items-center justify-between">
                  <span>{divTitle}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border/50 text-muted text-[11px]">
                        <th className="py-2 px-3 font-medium">{t('standings.team')}</th>
                        <th className="py-2 px-2 text-center font-medium">{t('standings.wins')}</th>
                        <th className="py-2 px-2 text-center font-medium">{t('standings.losses')}</th>
                        <th className="py-2 px-2 text-center font-medium">{t('standings.pct')}</th>
                        <th className="py-2 px-2 text-center font-medium">{t('standings.gb')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {divisionGroup.teamRecords.map((rec) => {
                        const teamMeta = teamsData.find((t) => t.id === rec.team.id);
                        const teamDisplayName =
                          lang === 'zh' ? teamMeta?.nameZh || rec.team.name : teamMeta?.name || rec.team.name;

                        return (
                          <tr key={rec.team.id} className="hover:bg-card-hover/50 transition-colors">
                            <td className="py-2 px-3 flex items-center gap-2">
                              <span className="font-mono text-muted text-[10px] w-3">
                                {rec.divisionRank}
                              </span>
                              <img
                                src={getTeamLogoUrl(rec.team.id)}
                                alt={teamDisplayName}
                                className="w-4 h-4 object-contain"
                              />
                              <Link
                                to={`/teams/${rec.team.id}`}
                                className="font-semibold text-main hover:text-team-primary truncate max-w-[120px]"
                              >
                                {teamDisplayName}
                              </Link>
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-medium">
                              {rec.wins}
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-muted">
                              {rec.losses}
                            </td>
                            <td className="py-2 px-2 text-center font-mono">
                              {rec.winningPercentage}
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-muted">
                              {rec.gamesBack === '-' ? '-' : rec.gamesBack}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
