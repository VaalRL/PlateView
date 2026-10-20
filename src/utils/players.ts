import playersData from '../data/players-zh-tw.json';

const zhNames: ReadonlyMap<number, string> = new Map(playersData.map((p) => [p.id, p.nameZh]));

/** A player's Chinese name from the dictionary, when he has one */
export const zhNameOf = (personId: number | undefined): string | undefined =>
  personId === undefined ? undefined : zhNames.get(personId);
