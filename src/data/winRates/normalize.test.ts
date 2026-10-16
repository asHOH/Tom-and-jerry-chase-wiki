import { buildWinRateCharacterLookup } from './characterLookup';
import { getCharacterWinRates } from './index';
import { getRankLabel, getWinRateRanks, normalizeWinRateRows } from './normalize';
import type { WinRatesEntry } from './types';

describe('win rate normalization', () => {
  it('combines both character table formats and skips summary rows', () => {
    const entry: WinRatesEntry = {
      timeRange: 'Test season',
      characterTables: [
        {
          rank: '全部',
          rows: [{ character: '表演者▪杰瑞', pickRate: '3.20%', winRate: '51.25%' }],
        },
      ],
      tables: [
        { rank: '至尊传奇', rows: [] },
        {
          rank: '机智黄金',
          rows: [{ rank: '机智黄金', teamType: '总体', catWin: '50.00%', mouseWin: '50.00%' }],
        },
        {
          rank: '至尊传奇',
          faction: '猫',
          rows: [{ character: '蓝猫', pickRate: '10.00%', winRate: '60.00%', banRate: '0.00%' }],
        },
      ],
    };
    const lookup = buildWinRateCharacterLookup([
      { id: '表演者•杰瑞', factionId: 'mouse' },
      { id: '汤姆', factionId: 'cat', aliases: ['蓝猫'] },
    ]);

    expect(normalizeWinRateRows(entry, lookup)).toEqual([
      {
        rank: '全部',
        character: '表演者▪杰瑞',
        characterId: '表演者•杰瑞',
        faction: 'mouse',
        pickRate: '3.20%',
        winRate: '51.25%',
        banRate: null,
        pickRateNum: 3.2,
        winRateNum: 51.25,
        banRateNum: null,
      },
      {
        rank: '至尊传奇',
        character: '蓝猫',
        characterId: '汤姆',
        faction: 'cat',
        sourceFaction: '猫',
        pickRate: '10.00%',
        winRate: '60.00%',
        banRate: '0.00%',
        pickRateNum: 10,
        winRateNum: 60,
        banRateNum: 0,
      },
    ]);
    expect(getWinRateRanks(entry)).toEqual(['全部', '至尊传奇', '机智黄金']);
  });

  it.each(['猫', '鼠'] as const)(
    'uses source faction %s for unresolved historical names without inventing a link',
    (sourceFaction) => {
      expect(
        normalizeWinRateRows(
          {
            timeRange: 'Test season',
            tables: [
              {
                rank: '至尊传奇',
                faction: sourceFaction,
                rows: [{ character: '历史名称', pickRate: '1.00%', winRate: '50.00%' }],
              },
            ],
          },
          {}
        )
      ).toEqual([
        expect.objectContaining({
          characterId: null,
          faction: sourceFaction === '猫' ? 'cat' : 'mouse',
          character: '历史名称',
        }),
      ]);
    }
  );

  it.each([
    ['missing character', {}],
    ['missing faction', buildWinRateCharacterLookup([{ id: '历史名称' }])],
  ] as const)('throws for %s when the source faction is also missing', (_, lookup) => {
    expect(() =>
      normalizeWinRateRows(
        {
          timeRange: 'Test season',
          characterTables: [
            {
              rank: '至尊传奇',
              rows: [{ character: '历史名称', pickRate: '1.00%', winRate: '50.00%' }],
            },
          ],
        },
        lookup
      )
    ).toThrow('Cannot resolve win-rate faction: Test season / 至尊传奇 / 历史名称');
  });

  it('includes punctuation variants in character details while retaining faction rank labels', () => {
    const rates = getCharacterWinRates(['表演者•杰瑞'], 'mouse');
    expect(rates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ timeRange: 'S28', rank: '无敌鼠皇' }),
        expect.objectContaining({ timeRange: 'S24 (2025.4.30-2025.5.25)', rank: '鼠皇2000分以上' }),
      ])
    );
    expect(getCharacterWinRates(['未知角色'], 'cat')).toEqual([]);
    expect(getCharacterWinRates(['表演者杰瑞'], 'mouse')).toEqual(rates);
    expect(getCharacterWinRates(['历史名称', '表演者杰瑞'], 'mouse')).toEqual(rates);
    expect(rates).toEqual(
      expect.arrayContaining([expect.objectContaining({ timeRange: 'S28', rank: '全段位' })])
    );
  });

  it('preserves source faction metadata when the character faction is omitted', () => {
    const rates = getCharacterWinRates(['汤姆']);
    const recent = rates.find((row) => row.timeRange === 'S28');
    expect(recent).toEqual(expect.objectContaining({ rank: '无敌猫鼠皇' }));
    expect(recent).not.toHaveProperty('faction');
    expect(rates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ timeRange: 'S25 (2025.7.10-2025.8.10)', faction: '猫' }),
      ])
    );
  });
});

describe('rank labels', () => {
  it.each([
    ['全部', undefined, '全段位'],
    ['全部', 'cat', '全段位'],
    ['无敌猫鼠皇', undefined, '无敌猫鼠皇'],
    ['无敌猫鼠皇', 'cat', '无敌猫皇'],
    ['无敌猫鼠皇', 'mouse', '无敌鼠皇'],
    ['皇2000分以上', 'cat', '猫皇2000分以上'],
    ['皇2000分以上', 'mouse', '鼠皇2000分以上'],
    ['皇0分-皇2000分', 'cat', '猫皇0分-猫皇2000分'],
    ['皇0分-皇2000分', 'mouse', '鼠皇0分-鼠皇2000分'],
    ['至尊传奇', 'mouse', '至尊传奇'],
  ] as const)('%s / %s displays as %s', (rank, faction, label) => {
    expect(getRankLabel(rank, faction)).toBe(label);
  });
});
