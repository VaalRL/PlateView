import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { usePlayerTransactionsQuery } from '../../services/queries';
import { getTeamLogoUrl } from '../../services/mlbApi';
import { useLanguage } from '../../hooks/useLanguage';
import { teamDisplayName } from '../../utils/teams';
import { TeamHoverCard } from '../common/TeamHoverCard';
import type { TransactionTeam } from '../../types/transactions';
import { isTrade, sortTransactions, transactionDate, transactionTypeLabel } from '../../utils/transactions';

/** Moves shown before "show all"; a veteran's record runs to well over a hundred */
const COLLAPSED_COUNT = 10;

const TeamLabel: React.FC<{ team: TransactionTeam; lang: 'zh' | 'en' }> = ({ team, lang }) => {
  const name = teamDisplayName(team.id, lang, team.name) || '—';
  if (team.id === undefined) return <span className="text-main font-semibold">{name}</span>;
  return (
    <TeamHoverCard teamId={team.id} name={team.name}>
      <Link
        to={`/teams/${team.id}`}
        className="inline-flex items-center gap-1.5 font-semibold text-main hover:text-team-primary hover:underline transition-colors"
      >
        <img
          src={getTeamLogoUrl(team.id)}
          alt=""
          className="w-4 h-4 object-contain shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span>{name}</span>
      </Link>
    </TeamHoverCard>
  );
};

/**
 * A player's roster moves, newest first: trades, signings, options, releases
 * and injured list moves at every level. The player page shows it under the
 * 轉隊記錄 tab, which supplies the heading.
 */
export const PlayerTransactions: React.FC<{ personId: number }> = ({ personId }) => {
  const { lang, t } = useLanguage();
  const { data, isLoading, isError } = usePlayerTransactionsQuery(personId);
  // Keyed to the player, like the level switcher: the route stays mounted when only :personId changes
  const [expandedFor, setExpandedFor] = useState<number | null>(null);
  const expanded = expandedFor === personId;

  const transactions = sortTransactions(data?.transactions);
  const shown = expanded ? transactions : transactions.slice(0, COLLAPSED_COUNT);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm">
      {isLoading ? (
        <div className="py-8 text-center text-muted text-xs animate-pulse">…</div>
      ) : isError ? (
        <div className="py-8 text-center text-rose-500 text-xs">{t('player.transactions_error')}</div>
      ) : transactions.length === 0 ? (
        <div className="py-8 text-center text-muted text-xs">{t('player.transactions_empty')}</div>
      ) : (
        <ul className="divide-y divide-border/30">
          {shown.map((tx, idx) => {
            const trade = isTrade(tx);
            const from = tx.fromTeam;
            const to = tx.toTeam;
            const moved = from?.id !== undefined && to?.id !== undefined && from.id !== to.id;
            const team = to ?? from;
            return (
              <li key={tx.id ?? idx} className="px-4 py-3 space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                  <span className="font-mono text-muted shrink-0">{transactionDate(tx)}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      trade ? 'bg-team-primary/15 text-team-primary' : 'bg-page text-muted border border-border/50'
                    }`}
                  >
                    {transactionTypeLabel(tx, lang)}
                  </span>
                  {moved ? (
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      <TeamLabel team={from} lang={lang} />
                      <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" aria-label="→" />
                      <TeamLabel team={to} lang={lang} />
                    </span>
                  ) : (
                    team && <TeamLabel team={team} lang={lang} />
                  )}
                </div>
                {tx.description && <p className="text-[11px] text-muted leading-relaxed">{tx.description}</p>}
              </li>
            );
          })}
        </ul>
      )}

      {transactions.length > COLLAPSED_COUNT && (
        <div className="border-t border-border/40 px-4 py-2.5 text-center">
          <button
            type="button"
            onClick={() => setExpandedFor(expanded ? null : personId)}
            className="text-xs font-semibold text-team-primary hover:underline"
          >
            {expanded
              ? t('player.transactions_collapse')
              : t('player.transactions_show_all', { count: transactions.length })}
          </button>
        </div>
      )}
    </div>
  );
};
