import { readFileSync } from 'fs';
import path from 'path';

const gridFiles = [
  'src/features/achievements/achievement-grid/AchievementGrid.tsx',
  'src/features/buffs/components/buff-grid/BuffGrid.tsx',
  'src/features/entities/entity-grid/EntityGrid.tsx',
  'src/features/fixtures/components/fixture-grid/FixtureGrid.tsx',
  'src/features/items/components/item-grid/ItemGrid.tsx',
  'src/features/items/components/itemGroups/itemGroup-detail/ItemGroupDetails.tsx',
  'src/features/items/components/itemGroups/itemGroup-grid/ItemGroupGrid.tsx',
  'src/features/maps/map-grid/MapGrid.tsx',
  'src/features/modes/components/mode-grid/ModeGrid.tsx',
];

const linkBlockPattern = /<Link\b[\s\S]*?<\/Link>/gu;
const cardDisplayPattern = /<\w+CardDisplay\b/u;
const catalogGridItemWrapperExpectations = [
  {
    file: 'src/features/fixtures/components/fixture-grid/FixtureGrid.tsx',
    wrapper: '<CatalogGridItem key={fixture.name} clip>',
  },
  {
    file: 'src/features/maps/map-grid/MapGrid.tsx',
    wrapper: '<CatalogGridItem key={map.name} clip>',
  },
  {
    file: 'src/features/modes/components/mode-grid/ModeGrid.tsx',
    wrapper: '<CatalogGridItem key={mode.name} clip>',
  },
] as const;

const localCatalogCardWrapperClassPattern = /\b(?:fixture-card|map-card|mode-card)\b/u;

const getLinkBlocks = (source: string) => source.match(linkBlockPattern) ?? [];
const countOccurrences = (source: string, needle: string) => source.split(needle).length - 1;

describe('grid card navigation conventions', () => {
  it('allows ordinary links outside card displays', () => {
    const source = `
      <Link href='/mechanics/buff/'>状态效果机制页</Link>
      <CatalogGridItem>
        <BuffCardDisplay buff={buff} />
      </CatalogGridItem>
    `;

    expect(getLinkBlocks(source)).not.toEqual(
      expect.arrayContaining([expect.stringMatching(cardDisplayPattern)])
    );
  });

  it('detects page links wrapping card displays', () => {
    const source = `
      <Link href='/buffs/foo'>
        <BuffCardDisplay buff={buff} />
      </Link>
    `;

    expect(getLinkBlocks(source)).toEqual(
      expect.arrayContaining([expect.stringMatching(cardDisplayPattern)])
    );
  });

  it.each(gridFiles)('lets card components own navigation in %s', (file) => {
    const source = readFileSync(path.join(process.cwd(), file), 'utf8');

    expect(getLinkBlocks(source)).not.toEqual(
      expect.arrayContaining([expect.stringMatching(cardDisplayPattern)])
    );
  });

  it('uses CatalogGridItem for migrated map, fixture, and mode card wrappers', () => {
    const offenders = catalogGridItemWrapperExpectations
      .filter(({ file, wrapper }) => {
        const source = readFileSync(path.join(process.cwd(), file), 'utf8');
        return (
          countOccurrences(source, wrapper) !== 1 ||
          countOccurrences(source, '</CatalogGridItem>') !== 1 ||
          localCatalogCardWrapperClassPattern.test(source)
        );
      })
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });
});
