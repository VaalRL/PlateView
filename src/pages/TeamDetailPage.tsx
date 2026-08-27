import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTeamRosterQuery, useTeamDetailQuery, useStandingsQuery } from '../services/queries';
import { getTeamLogoUrl, getPlayerHeadshotUrl } from '../services/mlbApi';
import { useFavorites } from '../hooks/useFavorites';
import { useLanguage } from '../hooks/useLanguage';
import { formatRateStat, formatEra, formatWhip } from '../utils/statsFormatters';
import teamsData from '../data/teams.json';
import { Star, ArrowLeft, Users, ShieldAlert, MapPin, Trophy } from 'lucide-react';

type RosterTab = 'active' | '40Man' | 'il';

export const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const idNum = parseInt(teamId || '0', 10);
  const teamMeta = teamsData.find((t) => t.id === idNum);

  const [activeTab, setActiveTab] = useState<RosterTab>('active');
  const { lang, t } = useLanguage();

  const { data: rosterData, isLoading: isRosterLoading, isError: isRosterError } = useTeamRosterQuery(
    idNum,
    activeTab === '40Man' ? '40Man' : 'active'
  );
  const { data: teamDetail } = useTeamDetailQuery(idNum);
  const { data: standingsData } = useStandingsQuery();

  const { isFavoriteTeam, toggleFavoriteTeam } = useFavorites();
  const isFav = isFavoriteTeam(idNum);

  const rawRoster = rosterData?.roster || [];

  // Filter injured list players
  const ilPlayers = rawRoster.filter(
    (p: any) =>
      p.status?.code?.includes('I') ||
      p.status?.description?.toLowerCase().includes('injured') ||
      p.status?.description?.toLowerCase().includes('il')
  );

  const displayRoster =
    activeTab === 'il'
      ? ilPlayers
      : rawRoster;

  const pitchers = displayRoster.filter((p: any) => p.position?.type === 'Pitcher');
  const positionPlayers = displayRoster.filter((p: any) => p.position?.type !== 'Pitcher');

  // Find standings record
  let teamRecord: any = null;
  standingsData?.records.forEach((div) => {
    const found = div.teamRecords.find((tr) => tr.team.id === idNum);
    if (found) teamRecord = found;
  });

  const venueName = teamDetail?.teams?.[0]?.venue?.name || teamMeta?.name || 'MLB Stadium';
  const teamTitle = lang === 'zh' ? teamMeta?.nameZh || 'MLB 球隊' : teamMeta?.name || 'MLB Team';
  const teamSubTitle = lang === 'zh' ? teamMeta?.name : teamMeta?.nameZh;
  const divisionText = lang === 'zh' ? teamMeta?.divisionZh : `${teamMeta?.league} ${teamMeta?.division}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('team.back')}</span>
      </Link>

      {/* Team Header Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <img
            src={getTeamLogoUrl(idNum)}
            alt={teamTitle}
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-main">
                {teamTitle}
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-page border border-border text-muted font-bold">
                {teamMeta?.abbrev}
              </span>
              {teamRecord && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-team-primary/15 text-team-primary font-bold">
                  {teamRecord.wins} {t('standings.wins')} {teamRecord.losses} {t('standings.losses')} ({teamRecord.winningPercentage})
                </span>
              )}
            </div>

            <p className="text-sm text-muted mt-1 font-medium">{teamSubTitle}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {divisionText} ({t('team.division_rank', { rank: teamRecord?.divisionRank || '-' })})
                </span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-team-primary" />
                <span>{t('team.stadium')}：{venueName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => toggleFavoriteTeam(idNum)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            isFav
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 shadow-sm'
              : 'bg-page border-border text-muted hover:text-main hover:border-team-primary'
          }`}
        >
          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
          <span>{isFav ? t('team.fav_active') : t('team.fav_btn')}</span>
        </button>
      </div>

      {/* Roster Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-team-primary" />
          <h2 className="text-lg font-bold text-main">{t('team.roster_title')}</h2>
        </div>

        <div className="flex items-center p-1 bg-card border border-border rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'active' ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
            }`}
          >
            {t('team.tab_active')}
          </button>
          <button
            onClick={() => setActiveTab('40Man')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === '40Man' ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
            }`}
          >
            {t('team.tab_40man')}
          </button>
          <button
            onClick={() => setActiveTab('il')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'il' ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>{t('team.tab_il')}</span>
          </button>
        </div>
      </div>

      {isRosterLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 h-72 animate-pulse" />
          <div className="bg-card border border-border rounded-xl p-6 h-72 animate-pulse" />
        </div>
      )}

      {isRosterError && (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-rose-500 text-sm">
          {t('team.load_error')}
        </div>
      )}

      {!isRosterLoading && !isRosterError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pitchers Column */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-bold text-sm text-team-primary flex items-center gap-1.5">
                <span>{t('team.pitchers_group')}</span>
                <span className="text-xs text-muted font-normal">
                  ({t('team.persons_count', { count: pitchers.length })})
                </span>
              </h3>
              <span className="text-[11px] text-muted font-mono">{t('team.pitcher_header')}</span>
            </div>

            <div className="divide-y divide-border/40 max-h-[700px] overflow-y-auto">
              {pitchers.map((item: any) => {
                const seasonPitching = item.person?.stats?.[0]?.splits?.[0]?.stat;

                return (
                  <Link
                    key={item.person.id}
                    to={`/players/${item.person.id}`}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-card-hover/70 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getPlayerHeadshotUrl(item.person.id)}
                        alt={item.person.fullName}
                        className="w-9 h-9 rounded-full bg-page object-cover border border-border group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="%2394a3b8" viewBox="0 0 16 16"%3E%3Cpath d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"%3E%3C/path%3E%3Cpath fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"%3E%3C/path%3E%3C/svg%3E';
                        }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-main group-hover:text-team-primary flex items-center gap-1.5">
                          <span>{item.person.fullName}</span>
                          {item.status?.code?.includes('I') && (
                            <span className="text-[10px] px-1 rounded bg-rose-500/20 text-rose-400 font-mono font-bold">
                              IL
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted">
                          #{item.jerseyNumber || '--'} &bull; {item.position?.abbreviation} &bull; {item.person?.pitchHand?.code || 'R'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs">
                      {seasonPitching ? (
                        <div>
                          <span className="font-bold text-main">{formatEra(seasonPitching.era)} ERA</span>
                          <span className="text-muted text-[11px] block">
                            {seasonPitching.wins}-{seasonPitching.losses} &bull; {formatWhip(seasonPitching.whip)} WHIP
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted text-[11px]">{item.status?.description || 'Active'}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
              {pitchers.length === 0 && (
                <div className="py-8 text-center text-xs text-muted">{t('team.empty_roster')}</div>
              )}
            </div>
          </div>

          {/* Position Players Column */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-bold text-sm text-team-primary flex items-center gap-1.5">
                <span>{t('team.position_group')}</span>
                <span className="text-xs text-muted font-normal">
                  ({t('team.persons_count', { count: positionPlayers.length })})
                </span>
              </h3>
              <span className="text-[11px] text-muted font-mono">{t('team.position_header')}</span>
            </div>

            <div className="divide-y divide-border/40 max-h-[700px] overflow-y-auto">
              {positionPlayers.map((item: any) => {
                const seasonHitting = item.person?.stats?.[0]?.splits?.[0]?.stat;

                return (
                  <Link
                    key={item.person.id}
                    to={`/players/${item.person.id}`}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-card-hover/70 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getPlayerHeadshotUrl(item.person.id)}
                        alt={item.person.fullName}
                        className="w-9 h-9 rounded-full bg-page object-cover border border-border group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="%2394a3b8" viewBox="0 0 16 16"%3E%3Cpath d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"%3E%3C/path%3E%3Cpath fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"%3E%3C/path%3E%3C/svg%3E';
                        }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-main group-hover:text-team-primary flex items-center gap-1.5">
                          <span>{item.person.fullName}</span>
                          {item.status?.code?.includes('I') && (
                            <span className="text-[10px] px-1 rounded bg-rose-500/20 text-rose-400 font-mono font-bold">
                              IL
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted">
                          #{item.jerseyNumber || '--'} &bull; {item.position?.abbreviation} &bull; {item.person?.batSide?.code || 'R'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs">
                      {seasonHitting ? (
                        <div>
                          <span className="font-bold text-main">{formatRateStat(seasonHitting.avg)}</span>
                          <span className="text-muted text-[11px] block">
                            {seasonHitting.homeRuns} HR &bull; {formatRateStat(seasonHitting.ops)} OPS
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted text-[11px]">{item.status?.description || 'Active'}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
              {positionPlayers.length === 0 && (
                <div className="py-8 text-center text-xs text-muted">{t('team.empty_roster')}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
