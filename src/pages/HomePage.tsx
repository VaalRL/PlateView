import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ScoreboardGrid } from '../components/scoreboard/ScoreboardGrid';
import { StandingsTable } from '../components/standings/StandingsTable';
import { FavoritesBar } from '../components/favorite/FavoritesBar';
import { useScheduleQuery } from '../services/queries';
import { formatApiDate } from '../utils/timezone';

export const HomePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

      {/* Main Scoreboard */}
      <ScoreboardGrid
        selectedDate={selectedDate}
        onDateChange={(newDate) => setSelectedDate(newDate)}
      />

      {/* Division Standings */}
      <StandingsTable />
    </div>
  );
};
