import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlayerDetailQuery } from '../services/queries';
import { getPlayerHeadshotUrl, getTeamLogoUrl } from '../services/mlbApi';
import { useFavorites } from '../hooks/useFavorites';
import { useLanguage } from '../hooks/useLanguage';
import {
  formatRateStat,
  formatEra,
  formatWhip,
  formatWar,
  formatPlusStat,
  formatFip,
  formatWoba,
  formatPer9,
} from '../utils/statsFormatters';
import playersData from '../data/players-zh-tw.json';
import teamsData from '../data/teams.json';
import { Star, ArrowLeft, Activity, Calendar, Award, Zap } from 'lucide-react';

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

  // Sabermetrics & Advanced Stats
  const hittingSabermetrics = statsGroups.find(
    (s: any) => s.group?.displayName === 'hitting' && s.type?.displayName === 'sabermetrics'
  )?.splits?.[0]?.stat;

  const pitchingSabermetrics = statsGroups.find(
    (s: any) => s.group?.displayName === 'pitching' && s.type?.displayName === 'sabermetrics'
  )?.splits?.[0]?.stat;

  const hittingAdvanced = statsGroups.find(
    (s: any) => s.group?.displayName === 'hitting' && s.type?.displayName === 'seasonAdvanced'
  )?.splits?.[0]?.stat;

  const pitchingAdvanced = statsGroups.find(
    (s: any) => s.group?.displayName === 'pitching' && s.type?.displayName === 'seasonAdvanced'
  )?.splits?.[0]?.stat;

  // Game Logs
  const hittingGameLogs = statsGroups.find(
    (s: any) => s.group?.displayName === 'hitting' && s.type?.displayName === 'gameLog'
  )?.splits || [];

  const pitchingGameLogs = statsGroups.find(
    (s: any) => s.group?.displayName === 'pitching' && s.type?.displayName === 'gameLog'
  )?.splits || [];

  // Sort game logs by date descending (most recent games first)
  const sortedPitchingGameLogs = useMemo(() => {
    return [...pitchingGameLogs].sort((a: any, b: any) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });
  }, [pitchingGameLogs]);

  const sortedHittingGameLogs = useMemo(() => {
    return [...hittingGameLogs].sort((a: any, b: any) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });
  }, [hittingGameLogs]);

  // True two-way player check (Ohtani or both significant hitting and pitching volume)
  const isTwoWay = useMemo(() => {
    if (idNum === 660271) return true; // Shohei Ohtani
    if (person?.primaryPosition?.name?.toLowerCase().includes('two-way')) return true;
    const atBats = (hittingSeasonStats?.atBats ?? 0) || (hittingCareerStats?.atBats ?? 0);
    const ip = parseFloat(pitchingSeasonStats?.inningsPitched ?? '0') || parseFloat(pitchingCareerStats?.inningsPitched ?? '0');
    return atBats >= 20 && ip >= 10;
  }, [idNum, person, hittingSeasonStats, hittingCareerStats, pitchingSeasonStats, pitchingCareerStats]);

  const hasHitting = !!(hittingSeasonStats || hittingCareerStats);
  const hasPitching = !!(pitchingSeasonStats || pitchingCareerStats);

  const effectiveRole =
    roleTab !== 'auto'
      ? roleTab
      : person?.primaryPosition?.type === 'Pitcher'
      ? 'pitching'
      : 'hitting';

  const activeHittingStats = statTypeTab === 'season' ? hittingSeasonStats : hittingCareerStats;
  const activePitchingStats = statTypeTab === 'season' ? pitchingSeasonStats : pitchingCareerStats;

  // Derived pitching stats (FIP / FIP+)
  const derivedFip = useMemo(() => {
    if (pitchingSabermetrics?.fip !== undefined) return pitchingSabermetrics.fip;
    if (!activePitchingStats) return null;
    const hr = activePitchingStats.homeRuns ?? 0;
    const bb = activePitchingStats.baseOnBalls ?? 0;
    const hbp = activePitchingStats.hitBatsmen ?? 0;
    const k = activePitchingStats.strikeOuts ?? 0;
    const ip = parseFloat(activePitchingStats.inningsPitched ?? '0');
    if (!ip || ip <= 0) return null;
    return (13 * hr + 3 * (bb + hbp) - 2 * k) / ip + 3.10;
  }, [pitchingSabermetrics, activePitchingStats]);

  const derivedFipPlus = useMemo(() => {
    if (pitchingSabermetrics?.fipMinus !== undefined && pitchingSabermetrics.fipMinus > 0) {
      return (100 / pitchingSabermetrics.fipMinus) * 100;
    }
    if (derivedFip && derivedFip > 0) {
      return (4.15 / derivedFip) * 100;
    }
    return null;
  }, [pitchingSabermetrics, derivedFip]);

  // Derived hitting OPS+ / wRC+
  const derivedOpsPlus = useMemo(() => {
    if (hittingSabermetrics?.wRcPlus !== undefined) return hittingSabermetrics.wRcPlus;
    if (!activeHittingStats) return null;
    const obp = parseFloat(activeHittingStats.obp || '0');
    const slg = parseFloat(activeHittingStats.slg || '0');
    if (!obp && !slg) return null;
    const val = 100 * (obp / 0.315 + slg / 0.400 - 1);
    return Math.max(0, val);
  }, [hittingSabermetrics, activeHittingStats]);

  // Primary name is always English; the dictionary Chinese name (when
  // available) shows as a secondary line in either language mode
  const primaryName = person?.fullName || zhPlayerMeta?.nameEn || 'MLB Player';
  const secondaryName = zhPlayerMeta?.nameZh || '';

  const activeGameLogs = (effectiveRole === 'pitching' ? sortedPitchingGameLogs : sortedHittingGameLogs).slice(0, 10);

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

            {(secondaryName || (zhPlayerMeta?.nicknames.length ?? 0) > 0) && (
              <p className="text-sm text-muted mt-0.5">
                {secondaryName}{' '}
                {zhPlayerMeta && zhPlayerMeta.nicknames.length > 0
                  ? `(${zhPlayerMeta.nicknames.slice(0, 3).join(' / ')})`
                  : ''}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-muted">
              {person?.currentTeam ? (
                (() => {
                  const mlbTeam = teamsData.find((t) => t.id === person.currentTeam.id);
                  const parentOrgMlbTeam = person.currentTeam.parentOrgId
                    ? teamsData.find((t) => t.id === person.currentTeam.parentOrgId)
                    : null;

                  if (mlbTeam) {
                    return (
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
                        <span>{lang === 'zh' ? mlbTeam.nameZh : mlbTeam.name}</span>
                      </Link>
                    );
                  }

                  // Minor league or affiliate team
                  return (
                    <span className="flex flex-wrap items-center gap-1.5 font-medium text-main">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[10px] font-bold">
                        {person.currentTeam.sport?.name || 'MiLB'}
                      </span>
                      <span>{person.currentTeam.name}</span>
                      {parentOrgMlbTeam && (
                        <span className="text-muted text-xs">
                          (
                          <Link
                            to={`/teams/${parentOrgMlbTeam.id}`}
                            className="text-team-primary hover:underline font-semibold"
                          >
                            {lang === 'zh' ? parentOrgMlbTeam.nameZh : parentOrgMlbTeam.name}
                          </Link>
                          {lang === 'zh' ? ' 旗下' : ' affiliate'})
                        </span>
                      )}
                    </span>
                  );
                })()
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
          onClick={() =>
            toggleFavoritePlayer(idNum, {
              nameZh: zhPlayerMeta?.nameZh,
              nameEn: person?.fullName,
            })
          }
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
              {person?.currentTeam?.sport?.name && person?.currentTeam?.sport?.id !== 1 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30 shadow-sm">
                  {person.currentTeam.sport.name}
                </span>
              )}
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

                {/* Advanced Sabermetrics Panel */}
                <div className="pt-3 border-t border-border/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-main">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('player.advanced_stats_title')}</span>
                    </div>
                    <span className="text-[10px] text-muted flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                      {t('stat.league_avg_hint')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {/* WAR */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.war')}</span>
                      <span
                        className={`text-xl font-mono font-black ${
                          (hittingSabermetrics?.war ?? 0) >= 3.0
                            ? 'text-amber-400'
                            : (hittingSabermetrics?.war ?? 0) >= 1.5
                            ? 'text-emerald-400'
                            : 'text-main'
                        }`}
                      >
                        {formatWar(hittingSabermetrics?.war)}
                      </span>
                    </div>

                    {/* wRC+ / OPS+ */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.wrc_plus')}</span>
                      <div className="flex items-baseline justify-center gap-1">
                        <span
                          className={`text-xl font-mono font-black ${
                            (derivedOpsPlus ?? 0) >= 130
                              ? 'text-emerald-400'
                              : (derivedOpsPlus ?? 0) >= 100
                              ? 'text-team-primary'
                              : 'text-muted'
                          }`}
                        >
                          {formatPlusStat(derivedOpsPlus)}
                        </span>
                        {derivedOpsPlus !== null && (
                          <span className="text-[9px] font-mono text-muted">
                            {derivedOpsPlus >= 100
                              ? `+${Math.round(derivedOpsPlus - 100)}%`
                              : `${Math.round(derivedOpsPlus - 100)}%`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* OPS */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.ops')}</span>
                      <span className="text-xl font-mono font-black text-emerald-400">
                        {activeHittingStats.ops ?? '---'}
                      </span>
                    </div>

                    {/* wOBA */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.woba')}</span>
                      <span className="text-xl font-mono font-bold text-main">
                        {formatWoba(hittingSabermetrics?.woba)}
                      </span>
                    </div>

                    {/* BABIP */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.babip')}</span>
                      <span className="text-xl font-mono font-bold text-main">
                        {formatRateStat(activeHittingStats.babip || hittingAdvanced?.babip)}
                      </span>
                    </div>

                    {/* ISO */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.iso')}</span>
                      <span className="text-xl font-mono font-bold text-main">
                        {formatRateStat(
                          hittingAdvanced?.iso ||
                            (activeHittingStats.slg && activeHittingStats.avg
                              ? (parseFloat(activeHittingStats.slg) - parseFloat(activeHittingStats.avg)).toFixed(3)
                              : undefined)
                        )}
                      </span>
                    </div>
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

                {/* Advanced Sabermetrics Panel */}
                <div className="pt-3 border-t border-border/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-main">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('player.advanced_stats_title')}</span>
                    </div>
                    <span className="text-[10px] text-muted flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                      {t('stat.league_avg_hint')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {/* WAR */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.war')}</span>
                      <span
                        className={`text-xl font-mono font-black ${
                          (pitchingSabermetrics?.war ?? 0) >= 3.0
                            ? 'text-amber-400'
                            : (pitchingSabermetrics?.war ?? 0) >= 1.5
                            ? 'text-emerald-400'
                            : 'text-main'
                        }`}
                      >
                        {formatWar(pitchingSabermetrics?.war ?? pitchingSabermetrics?.ra9War)}
                      </span>
                    </div>

                    {/* FIP */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.fip')}</span>
                      <span className="text-xl font-mono font-black text-team-primary">
                        {formatFip(derivedFip)}
                      </span>
                    </div>

                    {/* FIP+ */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.fip_plus')}</span>
                      <div className="flex items-baseline justify-center gap-1">
                        <span
                          className={`text-xl font-mono font-black ${
                            (derivedFipPlus ?? 0) >= 125
                              ? 'text-emerald-400'
                              : (derivedFipPlus ?? 0) >= 100
                              ? 'text-team-primary'
                              : 'text-muted'
                          }`}
                        >
                          {formatPlusStat(derivedFipPlus)}
                        </span>
                        {derivedFipPlus !== null && (
                          <span className="text-[9px] font-mono text-muted">
                            {derivedFipPlus >= 100
                              ? `+${Math.round(derivedFipPlus - 100)}%`
                              : `${Math.round(derivedFipPlus - 100)}%`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* xFIP */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.xfip')}</span>
                      <span className="text-xl font-mono font-bold text-main">
                        {formatFip(pitchingSabermetrics?.xfip)}
                      </span>
                    </div>

                    {/* K/9 */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.k9')}</span>
                      <span className="text-xl font-mono font-bold text-main">
                        {formatPer9(activePitchingStats.strikeoutsPer9Inn || pitchingAdvanced?.strikeoutsPer9)}
                      </span>
                    </div>

                    {/* BB/9 */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.bb9')}</span>
                      <span className="text-xl font-mono font-bold text-main">
                        {formatPer9(activePitchingStats.walksPer9Inn || pitchingAdvanced?.baseOnBallsPer9)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* If no hitting or pitching stats exist */}
            {!activeHittingStats && !activePitchingStats && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3 shadow-sm">
                <div className="text-4xl">🌱</div>
                <h3 className="text-base font-bold text-main">
                  {lang === 'zh' ? '尚無出賽數據' : 'No Statistics Available'}
                </h3>
                <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                  {lang === 'zh'
                    ? `${primaryName} 目前尚未記錄到常規賽統計數據。`
                    : `No regular season statistics have been recorded for ${primaryName} yet.`}
                </p>
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
                  {activeGameLogs.map((log: any, idx: number) => {
                    const oppTeam = teamsData.find((t) => t.id === log.opponent?.id);
                    const oppDisplayName = lang === 'zh' ? oppTeam?.nameZh || log.opponent?.name : log.opponent?.name || 'MLB';

                    return (
                      <tr key={idx} className="hover:bg-card-hover/50 transition-colors">
                        <td className="py-2.5 px-4 text-main font-semibold">{log.date}</td>
                        <td className="py-2.5 px-3">
                          {oppTeam ? (
                            <Link
                              to={`/teams/${oppTeam.id}`}
                              className="inline-flex items-center gap-1.5 hover:text-team-primary hover:underline font-semibold text-main transition-colors group"
                            >
                              <img
                                src={getTeamLogoUrl(oppTeam.id)}
                                alt={oppDisplayName}
                                className="w-4 h-4 object-contain shrink-0 group-hover:scale-110 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <span className="truncate max-w-[110px] sm:max-w-none">{oppDisplayName}</span>
                            </Link>
                          ) : (
                            <span className="text-muted font-medium truncate max-w-[110px] sm:max-w-none">
                              {oppDisplayName}
                            </span>
                          )}
                        </td>
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
                    );
                  })}
                  {activeGameLogs.length === 0 && (
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
