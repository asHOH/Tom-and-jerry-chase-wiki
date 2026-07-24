import { NextResponse } from 'next/server';

import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const {
    data: { buffs, cards, characters, entities, fixtures, items, maps, modes, specialSkills },
  } = await getPublishedGameDataSnapshot();
  const entryPaths = [
    ...Object.keys(characters).map((name) => `/characters/${encodeURIComponent(name)}`),
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
  const path = entryPaths[Math.floor(Math.random() * entryPaths.length)]!;
  return NextResponse.redirect(new URL(path, request.url));
}
