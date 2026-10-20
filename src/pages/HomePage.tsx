import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftRight, Award, MapPin } from 'lucide-react';
import { BirthdaysToday } from '../components/common/BirthdaysToday';
import { useLanguage } from '../hooks/useLanguage';
import { ScoreboardGrid } from '../components/scoreboard/ScoreboardGrid';
import { StandingsTable } from '../components/standings/StandingsTable';
import { FavoritesBar } from '../components/favorite/FavoritesBar';
import { useScheduleQuery } from '../services/queries';
import { formatApiDate } from '../utils/timezone';
import { LevelSelector } from '../components/common/LevelSelector';
import { MLB_LEVEL, type BrowsableLevel } from '../constants/levels';

export const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [level, setLevel] = useState<BrowsableLevel>(MLB_LEVEL);
  const dateStr = formatApiDate(selectedDate);
  const { data } = useScheduleQuery(dateStr);
  const games = data?.dates?.[0]?.games || [];
  const location = useLocation();

  // Navbar navigates here with { scrollTo } state instead of a timing hack
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (target) {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.state]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Pinned Favorites Bar — today's summary always uses the US game date */}
      <FavoritesBar games={games} />

      {/* Level switcher: scores and standings follow it; favorites stay MLB.
          The awards, transactions and Taiwan links sit beside it, their only entry on a phone */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <LevelSelector value={level} onChange={setLevel} />
        <div className="flex items-center gap-3">
          <Link
            to="/awards"
            className="inline-flex items-center gap-1 text-xs font-semibold text-team-primary hover:underline"
          >
            <Award className="w-3.5 h-3.5" />
            {t('awards.title')}
          </Link>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-team-primary hover:underline"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {t('moves.home_link')}
          </Link>
          <Link
            to="/taiwan"
            className="inline-flex items-center gap-1 text-xs font-semibold text-team-primary hover:underline"
          >
            <MapPin className="w-3.5 h-3.5" />
            {t('taiwan.home_link')}
          </Link>
        </div>
      </div>

      {/* Big leaguers whose birthday is today, when there are any */}
      <BirthdaysToday />

      {/* Main Scoreboard */}
      <ScoreboardGrid
        selectedDate={selectedDate}
        onDateChange={(newDate) => setSelectedDate(newDate)}
        sportId={level.id}
      />

      {/* Division Standings */}
      <StandingsTable level={level} />
    </div>
  );
};
