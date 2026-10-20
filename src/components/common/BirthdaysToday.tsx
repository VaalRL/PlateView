import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Cake } from 'lucide-react';
import { useSeasonPlayersQuery } from '../../services/queries';
import { useLanguage } from '../../hooks/useLanguage';
import { PlayerHoverCard } from './PlayerHoverCard';
import { getCurrentMlbSeason } from '../../utils/season';
import { ageOnNextBirthday, daysUntilBirthday } from '../../utils/birthdays';
import { zhNameOf } from '../../utils/players';
import { teamsById } from '../../utils/teams';

/**
 * Big leaguers whose birthday is today, by the viewer's calendar: a line on
 * the home page, absent on a day nobody on a roster was born.
 */
export const BirthdaysToday: React.FC = () => {
  const { lang, t } = useLanguage();
  const { data } = useSeasonPlayersQuery(getCurrentMlbSeason());
  const today = new Date();
  const dayKey = today.toDateString();
  const birthdays = useMemo(
    () =>
      (data?.people ?? [])
        .filter((p) => daysUntilBirthday(p.birthDate, today) === 0)
        .sort((a, b) => (a.birthDate ?? '').localeCompare(b.birthDate ?? '')),
    // Today changes once a day; the date string stands for it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, dayKey]
  );

  if (birthdays.length === 0) return null;
  return (
    <section aria-labelledby="birthdays-today" className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
      <h2 id="birthdays-today" className="inline-flex items-center gap-1 font-bold text-main">
        <Cake className="w-4 h-4 text-rose-500" />
        {t('birthdays.today')}
      </h2>
      {birthdays.map((p) => {
        const name = (lang === 'zh' ? zhNameOf(p.id) : undefined) ?? p.fullName;
        const team = teamsById.get(p.currentTeam?.id ?? -1)?.abbrev;
        return (
          <PlayerHoverCard key={p.id} personId={p.id}>
            <Link to={`/players/${p.id}`} className="text-muted hover:text-team-primary">
              <span className="font-semibold text-main">{name}</span>
              {' '}
              {[team, t('birthdays.turns', { age: ageOnNextBirthday(p.birthDate, today) ?? '' })].filter(Boolean).join(' · ')}
            </Link>
          </PlayerHoverCard>
        );
      })}
    </section>
  );
};
