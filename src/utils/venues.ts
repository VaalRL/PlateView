import type { VenueFieldInfo } from '../types/mlb';
import venuesData from '../data/venues.json';

/**
 * The 30 clubs' home parks and their fence distances, rebuilt weekly from
 * the API (scripts/update-venues.mjs), so a game there needs no request for
 * them. Other parks (a game in London or Tokyo) are still asked for.
 */
const bundled: ReadonlyMap<number, VenueFieldInfo> = new Map(
  (venuesData.venues as Array<{ id: number; fieldInfo: VenueFieldInfo }>).map((v) => [v.id, v.fieldInfo])
);

export function bundledFieldInfo(venueId: number | undefined): VenueFieldInfo | undefined {
  return venueId === undefined ? undefined : bundled.get(venueId);
}
