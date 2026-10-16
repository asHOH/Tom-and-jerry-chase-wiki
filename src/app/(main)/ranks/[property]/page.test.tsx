import { generateMetadata } from './page';

jest.mock('@/lib/gameData/published/publishedSnapshot', () => ({
  getPublishedDomainReadModel: jest.fn(),
}));

jest.mock('@/features/characters/components', () => ({
  CharacterRankingGrid: jest.fn(),
}));

describe('ranking metadata faction names', () => {
  it.each([
    ['cat', '猫阵营'],
    ['mouse', '鼠阵营'],
    ['', ''],
  ])('formats faction %s', async (faction, label) => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ property: 'maxHp' }),
      searchParams: Promise.resolve({ faction }),
    });

    expect(metadata.title).toBe(`Hp上限排行榜${label ? ` - ${label}` : ''}`);
  });

  it.each(['unknown', 'toString', 'constructor'])('rejects unknown faction %s', async (faction) => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ property: 'maxHp' }),
      searchParams: Promise.resolve({ faction }),
    });

    expect(metadata).toEqual({});
  });
});
