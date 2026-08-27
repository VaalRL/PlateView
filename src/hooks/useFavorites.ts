import { useState, useEffect } from 'react';

const FAV_TEAMS_KEY = 'plateview_fav_teams';
const FAV_PLAYERS_KEY = 'plateview_fav_players';

export function useFavorites() {
  const [favoriteTeams, setFavoriteTeams] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(FAV_TEAMS_KEY);
      return saved ? JSON.parse(saved) : [119]; // Default: Dodgers
    } catch {
      return [119];
    }
  });

  const [favoritePlayers, setFavoritePlayers] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(FAV_PLAYERS_KEY);
      return saved ? JSON.parse(saved) : [660271, 694973]; // Default: Ohtani, Skenes
    } catch {
      return [660271, 694973];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAV_TEAMS_KEY, JSON.stringify(favoriteTeams));
    } catch {
      // Ignore
    }
  }, [favoriteTeams]);

  useEffect(() => {
    try {
      localStorage.setItem(FAV_PLAYERS_KEY, JSON.stringify(favoritePlayers));
    } catch {
      // Ignore
    }
  }, [favoritePlayers]);

  const toggleFavoriteTeam = (teamId: number) => {
    setFavoriteTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const isFavoriteTeam = (teamId: number) => favoriteTeams.includes(teamId);

  const toggleFavoritePlayer = (playerId: number) => {
    setFavoritePlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const isFavoritePlayer = (playerId: number) => favoritePlayers.includes(playerId);

  return {
    favoriteTeams,
    favoritePlayers,
    toggleFavoriteTeam,
    isFavoriteTeam,
    toggleFavoritePlayer,
    isFavoritePlayer,
  };
}
