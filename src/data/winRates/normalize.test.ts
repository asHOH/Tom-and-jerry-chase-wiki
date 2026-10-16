import { buildWinRateCharacterLookup } from './characterLookup';
import { getCharacterWinRates } from './index';
import { getWinRateRanks, normalizeWinRateRows } from './normalize';
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

  it('uses the source faction for unresolved historical names without inventing a link', () => {
    expect(
      normalizeWinRateRows(
        {
          timeRange: 'Test season',
          tables: [
            {
              rank: '至尊传奇',
              faction: '猫',
              rows: [{ character: '历史名称', pickRate: '1.00%', winRate: '50.00%' }],
            },
          ],
        },
        {}
      )
    ).toEqual([
      expect.objectContaining({ characterId: null, faction: 'cat', character: '历史名称' }),
    ]);
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
