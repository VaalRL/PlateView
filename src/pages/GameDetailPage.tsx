import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGameScheduleQuery, useGameBoxscoreQuery } from '../services/queries';
import { getTeamLogoUrl } from '../services/mlbApi';
import { useLanguage } from '../hooks/useLanguage';
import { formatBilingualGameTime } from '../utils/timezone';
import { LinescoreTable } from '../components/scoreboard/LinescoreTable';
import { FieldAlignmentDiagram } from '../components/game/FieldAlignmentDiagram';
import { LineupOrderBoard } from '../components/game/LineupOrderBoard';
import { BattingTable, PitchingTable } from '../components/game/BoxscoreTables';
import teamsData from '../data/teams.json';
import { BoxscorePlayerEntry, BoxscoreResponse, BoxscoreTeamSide, GameSchedule } from '../types/mlb';
import { ArrowLeft, Loader2, MapPin, Info, Shield, ClipboardList, Table2 } from 'lucide-react';

type GameTab = 'alignment' | 'lineup' | 'box';

/** Roster list shared by the bench and bullpen blocks */
const PlayerChips: React.FC<{
  ids: number[];
  players: Record<string, BoxscorePlayerEntry>;
  label: string;
}> = ({
  ids,
  players,
  label,
}) => {
  if (ids.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-bold text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => {
          const p = players['ID' + id];
          if (!p?.person?.id) return null;
          return (
            <Link
              key={id}
              to={`/players/${p.person.id}`}
              className="text-[11px] px-2 py-0.5 rounded-full bg-page border border-border/60 text-main hover:border-team-primary hover:text-team-primary transition-colors"
            >
              {p.person.fullName}
              <span className="ml-1 font-mono text-[9px] text-muted">
                {p.position?.abbreviation}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

/** MLB's own substitution footnotes: "a-Grounded out for X in the 7th." */
const SubstitutionNotes: React.FC<{ teamBox: BoxscoreTeamSide; label: string }> = ({
  teamBox,
  label,
}) => {
  const notes = teamBox.note || [];
  if (notes.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="text-[11px] font-bold text-muted">{label}</div>
      {notes.map((note, idx) => (
        <p key={`${note.label ?? idx}`} className="text-[10px] text-muted leading-relaxed">
          <span className="font-bold text-main">{note.label}</span>
          {note.value ? `-${note.value}` : ''}
        </p>
      ))}
    </div>
  );
};

/** Before first pitch there is no lineup, so the matchup is the probable starters. */
const ProbablePitchers: React.FC<{ game: GameSchedule; awayName: string; homeName: string }> = ({
  game,
  awayName,
  homeName,
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {(['away', 'home'] as const).map((side) => {
        const pitcher = game.teams[side].probablePitcher;
        return (
          <div key={side} className="bg-page/60 p-4 rounded-xl border border-border/40">
            <span className="text-muted block text-[11px] font-semibold">
              {side === 'away' ? awayName : homeName} ({t(side === 'away' ? 'sb.sp_away' : 'sb.sp_home')})
            </span>
            {pitcher?.id ? (
              <Link
                to={`/players/${pitcher.id}`}
                className="text-main font-bold text-sm block mt-1 hover:text-team-primary hover:underline"
              >
                {pitcher.fullName}
              </Link>
            ) : (
              <span className="text-main font-bold text-sm block mt-1">
                {pitcher?.fullName || t('sb.tbd')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Standalone page for one game: defensive alignment, batting order with
 * substitutions, and the untruncated box score.
 */
export const GameDetailPage: React.FC = () => {
  const { gamePk } = useParams<{ gamePk: string }>();
  const pkNum = parseInt(gamePk || '0', 10);
  const { lang, t } = useLanguage();
  const [tab, setTab] = useState<GameTab>('alignment');

  const {
    data: scheduleData,
    isLoading: isScheduleLoading,
    isError: isScheduleError,
    refetch: refetchSchedule,
  } = useGameScheduleQuery(pkNum || undefined);

  const game = scheduleData?.dates?.[0]?.games?.[0];
  const isLive = game?.status?.abstractGameState === 'Live';

  // Live games poll alongside the scoreboard; finished games stay cached
  const {
    data: boxscore,
    isLoading: isBoxLoading,
    isError: isBoxError,
  } = useGameBoxscoreQuery(pkNum || undefined, isLive) as {
    data?: BoxscoreResponse;
    isLoading: boolean;
    isError: boolean;
  };

  if (!pkNum) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-muted">{t('game.not_found')}</div>;
  }

  if (isScheduleLoading) {
    return (
      <div className="flex justify-center items-center gap-2 py-24 text-sm text-muted">
        <Loader2 className="w-5 h-5 animate-spin text-team-primary" />
        <span>{t('game.loading')}</span>
      </div>
    );
  }

  if (isScheduleError || !game) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-sm text-muted">{isScheduleError ? t('game.error') : t('game.not_found')}</p>
        <button
          type="button"
          onClick={() => refetchSchedule()}
          className="text-xs font-semibold text-team-primary hover:underline"
        >
          {t('game.retry')}
        </button>
      </div>
    );
  }

  const awayMeta = teamsData.find((item) => item.id === game.teams.away.team.id);
  const homeMeta = teamsData.find((item) => item.id === game.teams.home.team.id);
  const awayName = lang === 'zh' ? awayMeta?.nameZh || game.teams.away.team.name : game.teams.away.team.name;
  const homeName = lang === 'zh' ? homeMeta?.nameZh || game.teams.home.team.name : game.teams.home.team.name;

  const awayBox = boxscore?.teams?.away;
  const homeBox = boxscore?.teams?.home;
  const hasBoxscore = !!awayBox && !!homeBox;

  // While live, the pitcher on the mound is worth calling out on the diagram
  const livePitcherId = isLive ? game.linescore?.defense?.pitcher?.id : undefined;

  const tabs: Array<{ id: GameTab; label: string; icon: React.ReactNode }> = [
    { id: 'alignment', label: t('game.tab_alignment'), icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'lineup', label: t('game.tab_lineup'), icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { id: 'box', label: t('game.tab_box'), icon: <Table2 className="w-3.5 h-3.5" /> },
  ];

  const renderTeamHeader = (side: 'away' | 'home') => {
    const teamGame = game.teams[side];
    const name = side === 'away' ? awayName : homeName;
    return (
      <Link to={`/teams/${teamGame.team.id}`} className="flex items-center gap-2.5 min-w-0 group">
        <img
          src={getTeamLogoUrl(teamGame.team.id)}
          alt={teamGame.team.name}
          className="w-10 h-10 shrink-0"
          loading="lazy"
        />
        <div className="min-w-0">
          <div className="text-sm font-bold text-main truncate group-hover:text-team-primary transition-colors">
            {name}
          </div>
          <div className="text-[11px] text-muted font-mono">
            {teamGame.leagueRecord?.wins ?? '-'}-{teamGame.leagueRecord?.losses ?? '-'}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('game.back')}</span>
      </Link>

      {/* Header: matchup, score, status, venue */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          {renderTeamHeader('away')}
          <div className="text-center shrink-0">
            <div className="text-2xl font-black font-mono text-main tabular-nums">
              {game.teams.away.score ?? '-'} : {game.teams.home.score ?? '-'}
            </div>
            <div
              className={`text-[11px] font-semibold ${isLive ? 'text-red-500' : 'text-muted'}`}
            >
              {game.status.detailedState}
              {isLive && game.linescore?.currentInningOrdinal
                ? ` · ${game.linescore.inningState ?? ''} ${game.linescore.currentInningOrdinal}`
                : ''}
            </div>
          </div>
          <div className="flex justify-end min-w-0 flex-1">{renderTeamHeader('home')}</div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted border-t border-border/40 pt-3">
          <span>{formatBilingualGameTime(game.gameDate, lang, true)}</span>
          {game.venue?.name && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {game.venue.name}
            </span>
          )}
          {game.decisions?.winner && (
            <span className="font-mono">
              {t('game.decision_win')}:{' '}
              <Link to={`/players/${game.decisions.winner.id}`} className="hover:text-team-primary hover:underline">
                {game.decisions.winner.fullName}
              </Link>
            </span>
          )}
          {game.decisions?.loser && (
            <span className="font-mono">
              {t('game.decision_loss')}:{' '}
              <Link to={`/players/${game.decisions.loser.id}`} className="hover:text-team-primary hover:underline">
                {game.decisions.loser.fullName}
              </Link>
            </span>
          )}
          {game.decisions?.save && (
            <span className="font-mono">
              {t('game.decision_save')}:{' '}
              <Link to={`/players/${game.decisions.save.id}`} className="hover:text-team-primary hover:underline">
                {game.decisions.save.fullName}
              </Link>
            </span>
          )}
        </div>

        {game.linescore && (
          <LinescoreTable
            linescore={game.linescore}
            awayAbbrev={awayMeta?.abbrev || 'AWAY'}
            homeAbbrev={homeMeta?.abbrev || 'HOME'}
            awayScore={game.teams.away.score}
            homeScore={game.teams.home.score}
            isLive={isLive}
          />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors ${
              tab === item.id
                ? 'bg-team-primary text-white border-team-primary'
                : 'bg-card text-muted border-border hover:text-main'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Body */}
      {isBoxLoading && (
        <div className="flex justify-center items-center gap-2 py-16 text-sm text-muted">
          <Loader2 className="w-5 h-5 animate-spin text-team-primary" />
          <span>{t('game.loading')}</span>
        </div>
      )}

      {!isBoxLoading && (isBoxError || !hasBoxscore) && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="text-center text-sm text-muted">
            {game.status.abstractGameState === 'Preview' ? t('game.no_lineup_yet') : t('game.error')}
          </p>
          {game.status.abstractGameState === 'Preview' && (
            <ProbablePitchers game={game} awayName={awayName} homeName={homeName} />
          )}
        </div>
      )}

      {!isBoxLoading && hasBoxscore && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-6">
          {tab === 'alignment' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <FieldAlignmentDiagram
                  teamBox={awayBox}
                  teamName={awayName}
                  highlightPersonId={livePitcherId}
                />
                <FieldAlignmentDiagram
                  teamBox={homeBox}
                  teamName={homeName}
                  highlightPersonId={livePitcherId}
                />
              </div>
              <p className="flex items-start gap-1.5 text-[10px] text-muted border-t border-border/40 pt-3">
                <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
                <span>{t('game.alignment_disclaimer')}</span>
              </p>
            </>
          )}

          {tab === 'lineup' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <LineupOrderBoard teamBox={awayBox} teamName={awayName} />
                <PlayerChips
                  ids={awayBox.bench || []}
                  players={awayBox.players || {}}
                  label={t('game.bench')}
                />
                <PlayerChips
                  ids={awayBox.bullpen || []}
                  players={awayBox.players || {}}
                  label={t('game.bullpen')}
                />
                <SubstitutionNotes teamBox={awayBox} label={t('game.notes')} />
              </div>
              <div className="space-y-5">
                <LineupOrderBoard teamBox={homeBox} teamName={homeName} />
                <PlayerChips
                  ids={homeBox.bench || []}
                  players={homeBox.players || {}}
                  label={t('game.bench')}
                />
                <PlayerChips
                  ids={homeBox.bullpen || []}
                  players={homeBox.players || {}}
                  label={t('game.bullpen')}
                />
                <SubstitutionNotes teamBox={homeBox} label={t('game.notes')} />
              </div>
            </div>
          )}

          {tab === 'box' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BattingTable teamBox={awayBox} title={awayName} />
                <BattingTable teamBox={homeBox} title={homeName} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PitchingTable teamBox={awayBox} title={awayName} />
                <PitchingTable teamBox={homeBox} title={homeName} />
              </div>
              {[awayBox, homeBox].some((b) => (b.info || []).length > 0) && (
                <div className="border-t border-border/40 pt-3 space-y-3">
                  <div className="text-[11px] font-bold text-muted">{t('game.notes')}</div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      { box: awayBox, name: awayName },
                      { box: homeBox, name: homeName },
                    ].map(({ box, name }) => (
                      <div key={name} className="space-y-1.5">
                        <div className="text-[10px] font-bold text-main">{name}</div>
                        {(box.info || []).map((group, groupIdx) => (
                          <div key={`${name}-${group.title ?? groupIdx}`}>
                            <div className="text-[10px] font-semibold text-team-primary">
                              {group.title}
                            </div>
                            {(group.fieldList || []).map((field, fieldIdx) => (
                              <p
                                key={`${name}-${groupIdx}-${fieldIdx}`}
                                className="text-[10px] text-muted leading-relaxed"
                              >
                                <span className="font-semibold text-main">{field.label}</span>
                                {field.value ? `: ${field.value}` : ''}
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GameDetailPage;
