import { useState, useEffect, useCallback } from 'react';
import {
  STORAGE_KEYS,
  DEFAULT_FAVORITE_TEAMS,
  DEFAULT_FAVORITE_PLAYERS,
  FAVORITES_UPDATED_EVENT,
} from '../constants/storage';

export interface FavoritePlayerMeta {
  nameZh?: string;
  nameEn?: string;
}

export function useFavorites() {
  const [favoriteTeams, setFavoriteTeams] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.favTeams);
      return saved ? JSON.parse(saved) : [...DEFAULT_FAVORITE_TEAMS];
    } catch {
      return [...DEFAULT_FAVORITE_TEAMS];
    }
  });

  const [favoritePlayers, setFavoritePlayers] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.favPlayers);
      return saved ? JSON.parse(saved) : [...DEFAULT_FAVORITE_PLAYERS];
    } catch {
      return [...DEFAULT_FAVORITE_PLAYERS];
    }
  });

  const [favoritePlayersMeta, setFavoritePlayersMeta] = useState<Record<number, FavoritePlayerMeta>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.favPlayersMeta);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const reloadFromStorage = useCallback(() => {
    try {
      // Keep the previous reference when storage matches current state,
      // so the persist effects below do not re-fire and loop the sync event
      const teams = localStorage.getItem(STORAGE_KEYS.favTeams);
      if (teams) {
        setFavoriteTeams((prev) => (JSON.stringify(prev) === teams ? prev : JSON.parse(teams)));
      }

      const players = localStorage.getItem(STORAGE_KEYS.favPlayers);
      if (players) {
        setFavoritePlayers((prev) => (JSON.stringify(prev) === players ? prev : JSON.parse(players)));
      }

      const meta = localStorage.getItem(STORAGE_KEYS.favPlayersMeta);
      if (meta) {
        setFavoritePlayersMeta((prev) => (JSON.stringify(prev) === meta ? prev : JSON.parse(meta)));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handleStorageChange = () => reloadFromStorage();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleStorageChange);
    };
  }, [reloadFromStorage]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.favTeams, JSON.stringify(favoriteTeams));
      window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));
    } catch {}
  }, [favoriteTeams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.favPlayers, JSON.stringify(favoritePlayers));
      window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));
    } catch {}
  }, [favoritePlayers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.favPlayersMeta, JSON.stringify(favoritePlayersMeta));
      window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));
    } catch {}
  }, [favoritePlayersMeta]);

  const toggleFavoriteTeam = (teamId: number) => {
    setFavoriteTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const isFavoriteTeam = (teamId: number) => favoriteTeams.includes(teamId);

  const toggleFavoritePlayer = (playerId: number, meta?: FavoritePlayerMeta) => {
    setFavoritePlayers((prev) => {
      const exists = prev.includes(playerId);
      if (exists) {
        return prev.filter((id) => id !== playerId);
      } else {
        if (meta) {
          setFavoritePlayersMeta((prevMeta) => ({
            ...prevMeta,
            [playerId]: meta,
          }));
        }
        return [...prev, playerId];
      }
    });
  };

  const isFavoritePlayer = (playerId: number) => favoritePlayers.includes(playerId);

  return {
    favoriteTeams,
    favoritePlayers,
    favoritePlayersMeta,
    toggleFavoriteTeam,
    isFavoriteTeam,
    toggleFavoritePlayer,
    isFavoritePlayer,
    reloadFromStorage,
  };
}
