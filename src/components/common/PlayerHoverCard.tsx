import React, { lazy } from 'react';
import { HoverCard } from './HoverCard';

const PlayerCardContent = lazy(() => import('./PlayerCardContent'));

/**
 * Wrap a link to a player: shows his current club (and its parent club when
 * he is in the minors) and any MLB leaderboard he is in the top five of.
 */
export const PlayerHoverCard: React.FC<{ personId?: number; children: React.ReactElement }> = ({
  personId,
  children,
}) => {
  if (personId === undefined) return children;
  return <HoverCard renderContent={() => <PlayerCardContent personId={personId} />}>{children}</HoverCard>;
};
