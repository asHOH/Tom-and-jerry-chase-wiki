import { readFileSync } from 'fs';

const publishedGameDataRoutes = [
  'src/app/(main)/achievements/[factionId]/[achievementName]/page.tsx',
  'src/app/(main)/buffs/[buffName]/page.tsx',
  'src/app/(main)/cards/[cardId]/page.tsx',
  'src/app/(main)/characters/[characterId]/page.tsx',
  'src/app/(main)/entities/[entityName]/page.tsx',
  'src/app/(main)/factions/[factionId]/page.tsx',
  'src/app/(main)/fixtures/[fixtureName]/page.tsx',
  'src/app/(main)/items/[itemName]/page.tsx',
  'src/app/(main)/maps/[mapName]/page.tsx',
  'src/app/(main)/modes/[modeName]/page.tsx',
  'src/app/(main)/special-skills/[factionId]/[skillId]/page.tsx',
  'src/app/maps/[mapName]/interactive/page.tsx',
] as const;

describe('published game-data route rendering contracts', () => {
  it.each(publishedGameDataRoutes)('%s remains statically generated', (routePath) => {
    const source = readFileSync(routePath, 'utf8');

    expect(source).toContain("export const dynamic = 'force-static'");
    expect(source).toContain('export function generateStaticParams()');
  });

  it('preserves character-detail time-based revalidation', () => {
    const source = readFileSync('src/app/(main)/characters/[characterId]/page.tsx', 'utf8');

    expect(source).toContain('export const revalidate = 28800');
  });
});
