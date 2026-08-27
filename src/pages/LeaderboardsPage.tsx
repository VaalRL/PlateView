import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeaderboardsQuery } from '../services/queries';
import { useLanguage } from '../hooks/useLanguage';
import { LeaderCard } from '../components/leaders/LeaderCard';
import {
  Trophy,
  ArrowLeft,
  Flame,
  Zap,
  Target,
  Shield,
  Activity,
  Award,
  Sparkles,
} from 'lucide-react';

export const LeaderboardsPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [statGroup, setStatGroup] = useState<'hitting' | 'pitching'>('hitting');
  const [leagueFilter, setLeagueFilter] = useState<'all' | 'al' | 'nl'>('all');

  const leagueId =
    leagueFilter === 'al' ? 103 : leagueFilter === 'nl' ? 104 : undefined;

  const hittingCategories = [
    'battingAverage',
    'onBasePlusSlugging',
    'homeRuns',
    'runsBattedIn',
    'hits',
    'stolenBases',
    'onBasePercentage',
    'sluggingPercentage',
  ];

  const pitchingCategories = [
    'earnedRunAverage',
    'walksAndHitsPerInningPitched',
    'strikeouts',
    'wins',
    'saves',
    'holds',
    'strikeoutsPer9Inn',
    'inningsPitched',
  ];

  const activeCategories =
    statGroup === 'hitting' ? hittingCategories : pitchingCategories;

  const { data, isLoading, isError, refetch } = useLeaderboardsQuery({
    statGroup,
    categories: activeCategories,
    leagueId,
    season: 2026,
    limit: 5,
  });

  const getCategoryTitle = (category: string) => {
    const zhMap: Record<string, string> = {
      battingAverage: '打擊率 (AVG)',
      homeRuns: '全壘打 (HR)',
      runsBattedIn: '打點 (RBI)',
      onBasePlusSlugging: '整體攻擊指數 (OPS)',
      hits: '安打數 (H)',
      stolenBases: '盜壘成功 (SB)',
      onBasePercentage: '上壘率 (OBP)',
      sluggingPercentage: '長打率 (SLG)',
      earnedRunAverage: '防禦率 (ERA)',
      walksAndHitsPerInningPitched: '每局被上壘率 (WHIP)',
      strikeouts: '奪三振 (SO)',
      wins: '勝投 (W)',
      saves: '救援成功 (SV)',
      holds: '中繼成功 (HLD)',
      strikeoutsPer9Inn: '每九局三振數 (K/9)',
      inningsPitched: '投球局數 (IP)',
    };

    const enMap: Record<string, string> = {
      battingAverage: 'Batting Average (AVG)',
      homeRuns: 'Home Runs (HR)',
      runsBattedIn: 'Runs Batted In (RBI)',
      onBasePlusSlugging: 'On-base Plus Slugging (OPS)',
      hits: 'Hits (H)',
      stolenBases: 'Stolen Bases (SB)',
      onBasePercentage: 'On-Base Percentage (OBP)',
      sluggingPercentage: 'Slugging Percentage (SLG)',
      earnedRunAverage: 'Earned Run Average (ERA)',
      walksAndHitsPerInningPitched: 'WHIP',
      strikeouts: 'Strikeouts (SO)',
      wins: 'Wins (W)',
      saves: 'Saves (SV)',
      holds: 'Holds (HLD)',
      strikeoutsPer9Inn: 'Strikeouts Per 9 (K/9)',
      inningsPitched: 'Innings Pitched (IP)',
    };

    return lang === 'zh' ? zhMap[category] || category : enMap[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'battingAverage':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'onBasePlusSlugging':
        return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'homeRuns':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'runsBattedIn':
        return <Target className="w-4 h-4 text-sky-400" />;
      case 'earnedRunAverage':
        return <Shield className="w-4 h-4 text-team-primary" />;
      case 'walksAndHitsPerInningPitched':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'strikeouts':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'saves':
        return <Award className="w-4 h-4 text-indigo-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-team-primary" />;
    }
  };

  // Group leaders by category from response
  const leaderGroups = data?.leagueLeaders || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Back to Scoreboard Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('player.back')}</span>
      </Link>

      {/* Page Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-main tracking-tight">
              {t('leaders.title')}
            </h1>
          </div>
          <p className="text-xs text-muted max-w-xl">
            {t('leaders.subtitle')}
          </p>
        </div>

        {/* Filters Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Stat Group Switcher (Hitting vs Pitching) */}
          <div className="flex items-center p-1 bg-page border border-border rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatGroup('hitting')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statGroup === 'hitting'
                  ? 'bg-team-primary text-white shadow-sm'
                  : 'text-muted hover:text-main'
              }`}
            >
              {t('leaders.tab_hitting')}
            </button>
            <button
              onClick={() => setStatGroup('pitching')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statGroup === 'pitching'
                  ? 'bg-team-primary text-white shadow-sm'
                  : 'text-muted hover:text-main'
              }`}
            >
              {t('leaders.tab_pitching')}
            </button>
          </div>

          {/* League Filter (MLB / AL / NL) */}
          <div className="flex items-center p-1 bg-page border border-border rounded-xl text-xs font-semibold">
            <button
              onClick={() => setLeagueFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                leagueFilter === 'all'
                  ? 'bg-card text-team-primary border border-border shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              {t('leaders.filter_all')}
            </button>
            <button
              onClick={() => setLeagueFilter('al')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                leagueFilter === 'al'
                  ? 'bg-card text-team-primary border border-border shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              {t('leaders.filter_al')}
            </button>
            <button
              onClick={() => setLeagueFilter('nl')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                leagueFilter === 'nl'
                  ? 'bg-card text-team-primary border border-border shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              {t('leaders.filter_nl')}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-5 h-72 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm text-rose-500 font-semibold">{t('sb.error')}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-team-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            {t('sb.retry')}
          </button>
        </div>
      )}

      {/* Leaderboards Grid */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {activeCategories.map((category) => {
            const group = leaderGroups.find(
              (g) => g.leaderCategory === category && g.statGroup === statGroup
            );

            if (!group) return null;

            return (
              <LeaderCard
                key={category}
                categoryGroup={group}
                title={getCategoryTitle(category)}
                icon={getCategoryIcon(category)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
