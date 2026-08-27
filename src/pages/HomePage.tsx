import React, { useState } from 'react';
import { ScoreboardGrid } from '../components/scoreboard/ScoreboardGrid';
import { StandingsTable } from '../components/standings/StandingsTable';
import { FavoritesBar } from '../components/favorite/FavoritesBar';
import { useScheduleQuery } from '../services/queries';
import { formatApiDate } from '../utils/timezone';

export const HomePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = formatApiDate(selectedDate);
  const { data } = useScheduleQuery(dateStr, true);
  const games = data?.dates?.[0]?.games || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Pinned Favorites Bar */}
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
