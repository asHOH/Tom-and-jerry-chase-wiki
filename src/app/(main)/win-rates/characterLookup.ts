import type { FactionId } from '@/data/types';

type CharacterIdentity = {
  id: string;
  factionId?: FactionId | undefined;
};

export type WinRateCharacterLookup = Readonly<Record<string, CharacterIdentity>>;

export function normalizeWinRateCharacterName(name: string): string {
  return name.replace(/[·•▪]/g, '');
}

export function buildWinRateCharacterLookup(
  characters: readonly (CharacterIdentity & { aliases?: readonly string[] })[]
): WinRateCharacterLookup {
  return Object.fromEntries([
    ...characters.flatMap(({ id, factionId, aliases = [] }) =>
      aliases.map((alias) => [normalizeWinRateCharacterName(alias), { id, factionId }])
    ),
    ...characters.map(({ id, factionId }) => [
      normalizeWinRateCharacterName(id),
      { id, factionId },
    ]),
  ]);
}
