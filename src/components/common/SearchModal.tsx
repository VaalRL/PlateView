import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, Shield, Globe, Loader2 } from 'lucide-react';
import { usePeopleSearchQuery } from '../../services/queries';
import { getPlayerHeadshotUrl, getTeamLogoUrl } from '../../services/mlbApi';
import { useLanguage } from '../../hooks/useLanguage';
import teamsData from '../../data/teams.json';
import playersData from '../../data/players-zh-tw.json';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { lang, t } = useLanguage();

  // Online search when query >= 2 characters
  const { data: onlineData, isLoading: isOnlineLoading } = usePeopleSearchQuery(query);

  // Close on Escape or shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Filter local teams and players
  const localResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { teams: [], players: [] };

    const matchedTeams = teamsData.filter(
      (teamItem) =>
        teamItem.name.toLowerCase().includes(q) ||
        teamItem.nameZh.includes(q) ||
        teamItem.abbrev.toLowerCase().includes(q)
    );

    const matchedPlayers = playersData.filter(
      (playerItem) =>
        playerItem.nameEn.toLowerCase().includes(q) ||
        playerItem.nameZh.includes(q) ||
        playerItem.nicknames.some((n) => n.toLowerCase().includes(q))
    );

    return { teams: matchedTeams, players: matchedPlayers };
  }, [query]);

  // Extract online players that are not already in local list
  const onlinePlayers = useMemo(() => {
    if (!onlineData?.people) return [];
    const localIds = new Set(localResults.players.map((p) => p.id));
    return onlineData.people.filter((p: any) => !localIds.has(p.id)).slice(0, 5);
  }, [onlineData, localResults.players]);

  // Flatten items for keyboard navigation
  const allItems = useMemo(() => {
    const items: Array<{ type: 'team' | 'player' | 'online_player'; id: number; path: string }> = [];
    localResults.teams.forEach((tItem) => items.push({ type: 'team', id: tItem.id, path: `/teams/${tItem.id}` }));
    localResults.players.forEach((pItem) => items.push({ type: 'player', id: pItem.id, path: `/players/${pItem.id}` }));
    onlinePlayers.forEach((op: any) => items.push({ type: 'online_player', id: op.id, path: `/players/${op.id}` }));
    return items;
  }, [localResults, onlinePlayers]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = allItems[selectedIndex];
      if (target) {
        navigate(target.path);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  let currentIndexTracker = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-24 px-3 sm:px-4 bg-black/70 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-page/40">
          <Search className="w-5 h-5 text-team-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('search.input_placeholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-main placeholder-muted focus:outline-none text-sm md:text-base font-medium"
          />
          {isOnlineLoading && <Loader2 className="w-4 h-4 text-muted animate-spin shrink-0" />}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
              className="text-muted hover:text-main p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-4">
          {query.trim() &&
            localResults.teams.length === 0 &&
            localResults.players.length === 0 &&
            onlinePlayers.length === 0 &&
            !isOnlineLoading && (
              <div className="py-12 text-center text-muted text-sm">
                {t('search.no_results')}
              </div>
            )}

          {/* Teams Group */}
          {localResults.teams.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-muted uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-team-primary" /> {t('search.teams_group')}
              </div>
              <div className="grid grid-cols-1 gap-1 mt-1">
                {localResults.teams.map((tItem) => {
                  const itemIndex = currentIndexTracker++;
                  const isSelected = itemIndex === selectedIndex;
                  const teamDisplayName = lang === 'zh' ? tItem.nameZh : tItem.name;

                  return (
                    <button
                      key={tItem.id}
                      onClick={() => {
                        navigate(`/teams/${tItem.id}`);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-team-primary/15 border border-team-primary/40 shadow-sm'
                          : 'hover:bg-card-hover border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getTeamLogoUrl(tItem.id)}
                          alt={teamDisplayName}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div>
                          <span className="font-bold text-sm text-main">{teamDisplayName}</span>
                          <span className="text-xs text-muted ml-2">{lang === 'zh' ? tItem.name : tItem.nameZh}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-page border border-border text-muted font-bold">
                        {tItem.abbrev}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Local High-Priority Players Group */}
          {localResults.players.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-muted uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-team-primary" /> {t('search.stars_group')}
              </div>
              <div className="grid grid-cols-1 gap-1 mt-1">
                {localResults.players.map((pItem) => {
                  const itemIndex = currentIndexTracker++;
                  const isSelected = itemIndex === selectedIndex;
                  const primaryName = lang === 'zh' ? pItem.nameZh : pItem.nameEn;
                  const secondaryName = lang === 'zh' ? pItem.nameEn : pItem.nameZh;

                  return (
                    <button
                      key={pItem.id}
                      onClick={() => {
                        navigate(`/players/${pItem.id}`);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-team-primary/15 border border-team-primary/40 shadow-sm'
                          : 'hover:bg-card-hover border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getPlayerHeadshotUrl(pItem.id)}
                          alt={primaryName}
                          className="w-8 h-8 rounded-full bg-page object-cover border border-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="%2394a3b8" viewBox="0 0 16 16"%3E%3Cpath d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"%3E%3C/path%3E%3Cpath fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"%3E%3C/path%3E%3C/svg%3E';
                          }}
                        />
                        <div>
                          <div className="font-bold text-sm text-main">{primaryName}</div>
                          <div className="text-xs text-muted">
                            {secondaryName} {pItem.nicknames.length > 0 && `(${pItem.nicknames[0]})`}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-team-primary/15 text-team-primary font-bold">
                        {pItem.team}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Online MLB Search Results Group */}
          {onlinePlayers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-muted uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-team-primary" /> {t('search.online_group')}
              </div>
              <div className="grid grid-cols-1 gap-1 mt-1">
                {onlinePlayers.map((op: any) => {
                  const itemIndex = currentIndexTracker++;
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={op.id}
                      onClick={() => {
                        navigate(`/players/${op.id}`);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-team-primary/15 border border-team-primary/40 shadow-sm'
                          : 'hover:bg-card-hover border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getPlayerHeadshotUrl(op.id)}
                          alt={op.fullName}
                          className="w-8 h-8 rounded-full bg-page object-cover border border-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="%2394a3b8" viewBox="0 0 16 16"%3E%3Cpath d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"%3E%3C/path%3E%3Cpath fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"%3E%3C/path%3E%3C/svg%3E';
                          }}
                        />
                        <div>
                          <div className="font-bold text-sm text-main">{op.fullName}</div>
                          <div className="text-xs text-muted">
                            #{op.primaryNumber || '--'} &bull; {op.primaryPosition?.abbreviation || 'MLB'}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-muted">
                        {op.currentTeam?.name || 'MLB'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!query.trim() && (
            <div className="py-6 text-center text-xs text-muted space-y-1">
              <p className="font-semibold text-main">{t('search.hint_title')}</p>
              <p>{t('search.hint_desc')}</p>
              <div className="pt-3 flex items-center justify-center gap-4 text-[11px] opacity-75">
                <span><kbd className="px-1 py-0.5 rounded bg-page border border-border">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-page border border-border">↓</kbd> {t('search.select')}</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-page border border-border">Enter</kbd> {t('search.open')}</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-page border border-border">Esc</kbd> {t('search.close')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
