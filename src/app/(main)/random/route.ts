import { NextResponse } from 'next/server';

import { GameDataManager } from '@/lib/dataManager';
import { buffs, cards, entities, fixtures, items, maps, modes, specialSkills } from '@/data';

export const dynamic = 'force-dynamic';

const entryPaths = [
  ...Object.keys(GameDataManager.getCharacters()).map(
    (name) => `/characters/${encodeURIComponent(name)}`
  ),
  ...Object.keys(cards).map((name) => `/cards/${encodeURIComponent(name)}`),
  ...(['cat', 'mouse'] as const).flatMap((faction) =>
    Object.keys(specialSkills[faction]).map(
      (name) => `/special-skills/${faction}/${encodeURIComponent(name)}`
    )
  ),
  ...Object.keys(items).map((name) => `/items/${encodeURIComponent(name)}`),
  ...Object.keys(entities).map((name) => `/entities/${encodeURIComponent(name)}`),
  ...Object.keys(buffs).map((name) => `/buffs/${encodeURIComponent(name)}`),
  ...Object.keys(maps).map((name) => `/maps/${encodeURIComponent(name)}`),
  ...Object.keys(fixtures).map((name) => `/fixtures/${encodeURIComponent(name)}`),
  ...Object.keys(modes).map((name) => `/modes/${encodeURIComponent(name)}`),
];

export function GET(request: Request) {
  const path = entryPaths[Math.floor(Math.random() * entryPaths.length)]!;
  return NextResponse.redirect(new URL(path, request.url));
}
