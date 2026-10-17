import type { FactionId } from '@/data/types';
import { buildWinRateCharacterLookup } from '@/data/winRates/characterLookup';
import { normalizeWinRateRows } from '@/data/winRates/normalize';

import {
  getUsageRateColor,
  getWinRateColor,
  getWinRateDisplayRows,
  toWinRatesCsv,
  WIN_RATE_COLUMNS,
} from './tableModel';

it.each([
  ['pick', 1, 5],
  ['ban', 0.75, 4.25],
] as const)(
  'interpolates %s colors within the surrounding stops',
  (metric, lowRate, higherRate) => {
    expect(getUsageRateColor(lowRate, metric)).toBe(
      `color-mix(in oklab, var(--wiki-${metric}-rate-0), var(--wiki-${metric}-rate-1) 50%)`
    );
    expect(getUsageRateColor(higherRate, metric)).toBe(
      `color-mix(in oklab, var(--wiki-${metric}-rate-2), var(--wiki-${metric}-rate-3) 25%)`
    );
  }
);

it.each(['pick', 'ban'] as const)('clamps %s colors at both ends of the scale', (metric) => {
  expect(getUsageRateColor(-1, metric)).toBe(getUsageRateColor(0, metric));
  expect(getUsageRateColor(100, metric)).toBe(`var(--wiki-${metric}-rate-5)`);
});

it('leaves missing ban rates uncolored', () => {
  expect(getUsageRateColor(null, 'ban')).toBeUndefined();
});

it.each([
  [31.5, 'lowest', 'low'],
  [42.5, 'low', 'mid'],
  [57.5, 'mid', 'high'],
  [68.5, 'high', 'highest'],
] as const)('interpolates the color for a %s%% win rate', (rate, from, to) => {
  expect(getWinRateColor(rate)).toBe(
    `color-mix(in oklab, var(--wiki-win-rate-${from}), var(--wiki-win-rate-${to}) 50%)`
  );
});

it('clamps win-rate colors at both ends of the scale', () => {
  expect(getWinRateColor(0)).toBe(getWinRateColor(28));
  expect(getWinRateColor(100)).toBe(getWinRateColor(72));
});

it('sorts within rank and faction groups, resets numbering, and leaves source rows intact', () => {
  const rows = normalizeWinRateRows(
    {
      timeRange: 'Test season',
      characterTables: [
        {
          rank: '至尊传奇',
          rows: [
            { character: '汤姆', pickRate: '1.00%', winRate: '90.00%' },
            { character: '杰瑞', pickRate: '2.00%', winRate: '50.00%' },
            { character: '泰菲', pickRate: '3.00%', winRate: '60.00%' },
          ],
        },
        { rank: '无敌猫鼠皇', rows: [{ character: '汤姆', pickRate: '1.00%', winRate: '40.00%' }] },
      ],
    },
    buildWinRateCharacterLookup([
      { id: '汤姆', factionId: 'cat' },
      { id: '杰瑞', factionId: 'mouse' },
      { id: '泰菲', factionId: 'mouse' },
    ])
  );
  const original = structuredClone(rows);
  const options = {
    ranks: new Set<string>(),
    factions: new Set<FactionId>(),
    sortColumn: 'winRateNum',
    sortDirection: 'desc',
  } as const;
  expect(
    getWinRateDisplayRows(rows, options).map(({ rank, character, no, groupStart }) => [
      rank,
      character,
      no,
      groupStart,
    ])
  ).toEqual([
    ['无敌猫鼠皇', '汤姆', 1, true],
    ['至尊传奇', '泰菲', 1, true],
    ['至尊传奇', '杰瑞', 2, false],
    ['至尊传奇', '汤姆', 1, true],
  ]);
  expect(
    getWinRateDisplayRows(rows, {
      ...options,
      ranks: new Set(['至尊传奇']),
      factions: new Set(['mouse']),
    }).map(({ character }) => character)
  ).toEqual(['泰菲', '杰瑞']);
  expect(rows).toEqual(original);
});

it('exports the selected columns in order and escapes commas, quotes, and line breaks', () => {
  const [row] = normalizeWinRateRows(
    {
      timeRange: 'Test season',
      characterTables: [
        {
          rank: '全部',
          faction: '鼠',
          rows: [{ character: '名称,"引号"\n下一行', pickRate: '2.00%', winRate: '50.00%' }],
        },
      ],
    },
    {}
  );
  const columns = WIN_RATE_COLUMNS.filter(({ key }) => key === 'character' || key === 'banRate');
  expect(toWinRatesCsv([{ ...row!, no: 1, groupStart: true }], columns)).toBe(
    'No.,角色,禁用率\n1,"名称,""引号""\n下一行",'
  );
});
