import React, { lazy } from 'react';
import { HoverCard } from './HoverCard';

const TeamCardContent = lazy(() => import('./TeamCardContent'));

/**
 * Wrap a link to a team: a big league club shows its division rank, win
 * percentage and record; a minor league club shows whose system it is in.
 */
export const TeamHoverCard: React.FC<{ teamId?: number; name?: string; children: React.ReactElement }> = ({
  teamId,
  name,
  children,
}) => {
  if (teamId === undefined) return children;
  return (
    <HoverCard renderContent={() => <TeamCardContent teamId={teamId} name={name} />}>
      {children}
    </HoverCard>
  );
};
