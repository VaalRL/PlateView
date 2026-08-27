import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlayerDetailQuery } from '../services/queries';
import { getPlayerHeadshotUrl, getTeamLogoUrl } from '../services/mlbApi';
import { useFavorites } from '../hooks/useFavorites';
import { useLanguage } from '../hooks/useLanguage';
import { formatRateStat, formatEra, formatWhip } from '../utils/statsFormatters';
import playersData from '../data/players-zh-tw.json';
import { Star, ArrowLeft, Activity, Calendar, Award } from 'lucide-react';

export const PlayerDetailPage: React.FC = () => {
  const { personId } = useParams<{ personId: string }>();
  const idNum = parseInt(personId || '0', 10);
  const zhPlayerMeta = playersData.find((p) => p.id === idNum);

  const [statTypeTab, setStatTypeTab] = useState<'season' | 'career'>('season');
  const [roleTab, setRoleTab] = useState<'auto' | 'hitting' | 'pitching'>('auto');

  const { data, isLoading, isError } = usePlayerDetailQuery(idNum);
  const { isFavoritePlayer, toggleFavoritePlayer } = useFavorites();
  const { lang, t } = useLanguage();

  const isFav = isFavoritePlayer(idNum);
  const person = data?.people?.[0];

  const statsGroups = person?.stats || [];

  // Season Stats
  const hittingSeasonStats = statsGroups.find(
    (s: any) => s.group?.displayName === 'hitting' && s.type?.displayName === 'season'
  )?.splits?.[0]?.stat;

  const pitchingSeasonStats = statsGroups.find(
    (s: any) => s.group?.displayName === 'pitching' && s.type?.displayName === 'season'
  )?.splits?.[0]?.stat;

  // Career Stats
  const hittingCareerStats = statsGroups.find(
    (s: any) => s.group?.displayName === 'hitting' && s.type?.displayName === 'career'
  )?.splits?.[0]?.stat;

  const pitchingCareerStats = statsGroups.find(
    (s: any) => s.group?.displayName === 'pitching' && s.type?.displayName === 'career'
  )?.splits?.[0]?.stat;

  // Game Logs
  const hittingGameLogs = statsGroups.find(
    (s: any) => s.group?.displayName === 'hitting' && s.type?.displayName === 'gameLog'
  )?.splits || [];

  const pitchingGameLogs = statsGroups.find(
    (s: any) => s.group?.displayName === 'pitching' && s.type?.displayName === 'gameLog'
  )?.splits || [];

  const hasHitting = !!(hittingSeasonStats || hittingCareerStats || hittingGameLogs.length > 0);
  const hasPitching = !!(pitchingSeasonStats || pitchingCareerStats || pitchingGameLogs.length > 0);
  const isTwoWay = hasHitting && hasPitching;

  const effectiveRole =
    roleTab !== 'auto'
      ? roleTab
      : person?.primaryPosition?.type === 'Pitcher'
      ? 'pitching'
      : 'hitting';

  const activeHittingStats = statTypeTab === 'season' ? hittingSeasonStats : hittingCareerStats;
  const activePitchingStats = statTypeTab === 'season' ? pitchingSeasonStats : pitchingCareerStats;

  const displayNameZh = zhPlayerMeta?.nameZh || person?.fullName || 'MLB 球星';
  const displayNameEn = person?.fullName || zhPlayerMeta?.nameEn || 'MLB Player';

  const primaryName = lang === 'zh' ? displayNameZh : displayNameEn;
  const secondaryName = lang === 'zh' ? displayNameEn : displayNameZh;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('player.back')}</span>
      </Link>

      {/* Player Header Banner (Renders immediately using local or remote metadata) */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <img
            src={getPlayerHeadshotUrl(idNum)}
            alt={primaryName}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-page object-cover border-2 border-border shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="%2394a3b8" viewBox="0 0 16 16"%3E%3Cpath d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"%3E%3C/path%3E%3Cpath fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"%3E%3C/path%3E%3C/svg%3E';
            }}
          />
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-main">
                {primaryName}
              </h1>
              {person?.primaryNumber && (
                <span className="text-sm font-mono px-2 py-0.5 rounded bg-team-primary/20 text-team-primary font-bold">
                  #{person.primaryNumber}
                </span>
              )}
              {isTwoWay && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                  {t('player.two_way')}
                </span>
              )}
            </div>

            <p className="text-sm text-muted mt-0.5">
              {secondaryName}{' '}
              {lang === 'zh' && zhPlayerMeta && zhPlayerMeta.nicknames.length > 0
                ? `(${zhPlayerMeta.nicknames.slice(0, 3).join(' / ')})`
                : ''}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-muted">
              {person?.currentTeam ? (
                <Link
                  to={`/teams/${person.currentTeam.id}`}
                  className="flex items-center gap-1.5 font-semibold text-main hover:text-team-primary"
                >
                  <img
                    src={getTeamLogoUrl(person.currentTeam.id)}
                    alt={person.currentTeam.name}
                    className="w-4 h-4 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span>{person.currentTeam.name}</span>
                </Link>
              ) : zhPlayerMeta?.team ? (
                <span className="font-semibold text-team-primary">{zhPlayerMeta.team}</span>
              ) : null}

              {person?.primaryPosition && (
                <>
                  <span>&bull;</span>
                  <span>{t('player.position')}：{person.primaryPosition.name}</span>
                </>
              )}
              {person?.pitchHand && person?.batSide && (
                <>
                  <span>&bull;</span>
                  <span>
                    {t('player.throw_bat')}：{person.pitchHand.code}/{person.batSide.code}
                  </span>
                </>
              )}
              {person?.currentAge && (
                <>
                  <span>&bull;</span>
                  <span>{t('player.age')}：{person.currentAge} {t('player.age_unit')}</span>
                </>
              )}
              {person?.height && person?.weight && (
                <>
                  <span>&bull;</span>
                  <span>
                    {t('player.physique')}：{person.height} / {person.weight} lbs
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => toggleFavoritePlayer(idNum)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            isFav
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 shadow-sm'
              : 'bg-page border-border text-muted hover:text-main hover:border-team-primary'
          }`}
        >
          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
          <span>{isFav ? t('player.fav_active') : t('player.fav_btn')}</span>
        </button>
      </div>

      {isLoading && (
        <div className="bg-card border border-border rounded-2xl p-8 h-64 animate-pulse" />
      )}

      {isError && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-rose-500 text-sm">
          {t('player.load_error')}
        </div>
      )}

      {!isLoading && !isError && person && (
        <>
          {/* Stats Controls & Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-team-primary" />
              <h2 className="text-lg font-bold text-main">{t('player.stats_title')}</h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Season vs Career Switcher */}
              <div className="flex items-center p-1 bg-card border border-border rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setStatTypeTab('season')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    statTypeTab === 'season'
                      ? 'bg-team-primary text-white shadow-sm'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  {t('player.tab_season')}
                </button>
                <button
                  onClick={() => setStatTypeTab('career')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    statTypeTab === 'career'
                      ? 'bg-team-primary text-white shadow-sm'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  {t('player.tab_career')}
                </button>
              </div>

              {/* Two-Way Player Hitting / Pitching Switcher */}
              {isTwoWay && (
                <div className="flex items-center p-1 bg-card border border-border rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setRoleTab('hitting')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      effectiveRole === 'hitting'
                        ? 'bg-amber-500 text-black font-bold shadow-sm'
                        : 'text-muted hover:text-main'
                    }`}
                  >
                    {t('player.tab_hitting')}
                  </button>
                  <button
                    onClick={() => setRoleTab('pitching')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      effectiveRole === 'pitching'
                        ? 'bg-amber-500 text-black font-bold shadow-sm'
                        : 'text-muted hover:text-main'
                    }`}
                  >
                    {t('player.tab_pitching')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Display Cards */}
          <div className="space-y-6">
            {/* Batting Card */}
            {(effectiveRole === 'hitting' || !hasPitching) && activeHittingStats && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-team-primary" />
                    <span>
                      🏏 {statTypeTab === 'season' ? t('player.season_hitting_title') : t('player.career_hitting_title')}
                    </span>
                  </h3>
                  <span className="text-xs font-mono text-muted">
                    {t('player.games_played', { count: activeHittingStats.gamesPlayed ?? 0 })} &bull;{' '}
                    {t('player.at_bats', { count: activeHittingStats.atBats ?? 0 })}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.avg')}</span>
                    <span className="text-2xl font-mono font-black text-team-primary">
                      {formatRateStat(activeHittingStats.avg)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.hr')}</span>
                    <span className="text-2xl font-mono font-black text-main">
                      {activeHittingStats.homeRuns ?? 0}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.rbi')}</span>
                    <span className="text-2xl font-mono font-black text-main">
                      {activeHittingStats.rbi ?? 0}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.ops')}</span>
                    <span className="text-2xl font-mono font-black text-emerald-400">
                      {activeHittingStats.ops ?? '---'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.hits')}</span>
                    <span className="text-2xl font-mono font-bold text-main">
                      {activeHittingStats.hits ?? 0}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.obp')}</span>
                    <span className="text-2xl font-mono font-bold text-main">
                      {formatRateStat(activeHittingStats.obp)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.sb')}</span>
                    <span className="text-2xl font-mono font-bold text-main">
                      {activeHittingStats.stolenBases ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Pitching Card */}
            {(effectiveRole === 'pitching' || !hasHitting) && activePitchingStats && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-team-primary" />
                    <span>
                      ⚾ {statTypeTab === 'season' ? t('player.season_pitching_title') : t('player.career_pitching_title')}
                    </span>
                  </h3>
                  <span className="text-xs font-mono text-muted">
                    {t('player.games_played', { count: activePitchingStats.gamesPlayed ?? 0 })} &bull;{' '}
                    {t('player.games_started', { count: activePitchingStats.gamesStarted ?? 0 })}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.era')}</span>
                    <span className="text-2xl font-mono font-black text-team-primary">
                      {formatEra(activePitchingStats.era)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.wl')}</span>
                    <span className="text-2xl font-mono font-black text-main">
                      {activePitchingStats.wins ?? 0}-{activePitchingStats.losses ?? 0}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.so')}</span>
                    <span className="text-2xl font-mono font-black text-main">
                      {activePitchingStats.strikeOuts ?? 0}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.whip')}</span>
                    <span className="text-2xl font-mono font-black text-emerald-400">
                      {formatWhip(activePitchingStats.whip)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.ip')}</span>
                    <span className="text-2xl font-mono font-bold text-main">
                      {activePitchingStats.inningsPitched ?? '0.0'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.h_allowed')}</span>
                    <span className="text-2xl font-mono font-bold text-main">
                      {activePitchingStats.hits ?? 0}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.sv')}</span>
                    <span className="text-2xl font-mono font-bold text-main">
                      {activePitchingStats.saves ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Game Logs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-team-primary" />
                <h2 className="text-lg font-bold text-main">
                  {t('player.game_logs_title')}
                </h2>
              </div>
              <span className="text-xs text-muted">
                {effectiveRole === 'pitching' ? t('player.pitching_logs') : t('player.hitting_logs')}
              </span>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-xs text-left font-mono">
                <thead>
                  <tr className="border-b border-border text-muted text-[11px] bg-page/60">
                    <th className="py-3 px-4 font-medium">{lang === 'zh' ? '日期' : 'Date'}</th>
                    <th className="py-3 px-3 font-medium">{lang === 'zh' ? '對手' : 'Opponent'}</th>
                    {effectiveRole === 'pitching' ? (
                      <>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '結果' : 'Dec'}</th>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '局數' : 'IP'}</th>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '安打' : 'H'}</th>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '失分' : 'R'}</th>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '責失' : 'ER'}</th>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '三振' : 'K'}</th>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '保送' : 'BB'}</th>
                        <th className="py-3 px-2 text-center font-medium">ERA</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '打數' : 'AB'}</th>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '得分' : 'R'}</th>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '安打' : 'H'}</th>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '打點' : 'RBI'}</th>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '全壘打' : 'HR'}</th>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '保送' : 'BB'}</th>
                        <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '三振' : 'SO'}</th>
                        <th className="py-3 px-2 text-center font-medium">AVG</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {(effectiveRole === 'pitching' ? pitchingGameLogs : hittingGameLogs)
                    .slice(0, 10)
                    .map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-card-hover/50 transition-colors">
                        <td className="py-2.5 px-4 text-main font-semibold">{log.date}</td>
                        <td className="py-2.5 px-3 text-muted">{log.opponent?.name || 'MLB'}</td>
                        {effectiveRole === 'pitching' ? (
                          <>
                            <td className="py-2.5 px-2 text-center font-bold text-main">
                              {log.stat?.decision || '-'}
                            </td>
                            <td className="py-2.5 px-2 text-center">{log.stat?.inningsPitched}</td>
                            <td className="py-2.5 px-2 text-center">{log.stat?.hits}</td>
                            <td className="py-2.5 px-2 text-center">{log.stat?.runs}</td>
                            <td className="py-2.5 px-2 text-center">{log.stat?.earnedRuns}</td>
                            <td className="py-2.5 px-2 text-center font-bold text-team-primary">
                              {log.stat?.strikeOuts}
                            </td>
                            <td className="py-2.5 px-2 text-center">{log.stat?.baseOnBalls}</td>
                            <td className="py-2.5 px-2 text-center">{log.stat?.era}</td>
                          </>
                        ) : (
                          <>
                            <td className="py-2.5 px-2 text-center">{log.stat?.atBats}</td>
                            <td className="py-2.5 px-2 text-center">{log.stat?.runs}</td>
                            <td className="py-2.5 px-2 text-center font-bold text-team-primary">
                              {log.stat?.hits}
                            </td>
                            <td className="py-2.5 px-2 text-center">{log.stat?.rbi}</td>
                            <td className="py-2.5 px-2 text-center font-bold text-main">
                              {log.stat?.homeRuns}
                            </td>
                            <td className="py-2.5 px-2 text-center">{log.stat?.baseOnBalls}</td>
                            <td className="py-2.5 px-2 text-center">{log.stat?.strikeOuts}</td>
                            <td className="py-2.5 px-2 text-center font-semibold text-main">
                              {log.stat?.avg}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  {(effectiveRole === 'pitching' ? pitchingGameLogs : hittingGameLogs).length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted font-sans">
                        {t('player.empty_logs')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
