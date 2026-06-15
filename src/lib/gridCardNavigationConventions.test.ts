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

const getLinkBlocks = (source: string) => source.match(linkBlockPattern) ?? [];

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
});
