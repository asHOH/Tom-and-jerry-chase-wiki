import type { AnchorHTMLAttributes } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import type { WinRatesEntry } from '@/data/winRates';

import { buildWinRateCharacterLookup } from './characterLookup';
import WinRatesClient from './WinRatesClient';

jest.mock('@/context/DarkModeContext', () => ({ useDarkMode: () => [false] }));
jest.mock('@/components/ui/MotionButton', () => jest.requireActual('@/components/ui/Button'));
jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));
jest.mock('@/data/winRates', () => ({
  winRatesData: [
    {
      timeRange: 'S28',
      characterTables: [
        {
          rank: '至尊传奇',
          rows: [
            { character: '表演者▪杰瑞', pickRate: '3.00%', winRate: '70.00%' },
            { character: '海盗杰瑞', pickRate: '2.00%', winRate: '50.00%', banRate: '2.00%' },
            { character: '大表哥', pickRate: '1.00%', winRate: '60.00%', banRate: '0.00%' },
            { character: '蓝猫', pickRate: '4.00%', winRate: '55.00%', banRate: '4.00%' },
          ],
        },
        {
          rank: '机智黄金',
          rows: [{ character: '杰瑞', pickRate: '2.00%', winRate: '40.00%' }],
        },
      ],
    },
    {
      timeRange: 'S24',
      tables: [
        {
          rank: '至尊传奇',
          faction: '猫',
          rows: [{ character: '蓝猫', pickRate: '2.00%', winRate: '60.00%' }],
        },
        {
          rank: '至尊传奇',
          faction: '鼠',
          rows: [{ character: '海盗杰瑞', pickRate: '3.00%', winRate: '40.00%' }],
        },
      ],
    },
  ] satisfies WinRatesEntry[],
}));

const characterLookup = buildWinRateCharacterLookup([
  { id: '表演者•杰瑞', factionId: 'mouse', aliases: ['表演者杰瑞'] },
  { id: '航海士杰瑞', factionId: 'mouse', aliases: ['海盗杰瑞'] },
  { id: '蒙金奇', factionId: 'mouse', aliases: ['大表哥'] },
  { id: '杰瑞', factionId: 'mouse' },
  { id: '汤姆', factionId: 'cat', aliases: ['蓝猫'] },
]);

const clickOption = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const table = () => within(screen.getByRole('table'));
const characterNames = () =>
  table()
    .getAllByRole('link')
    .map((link) => link.textContent);

describe('WinRatesClient', () => {
  beforeEach(() => {
    render(<WinRatesClient description='胜率数据' characterLookup={characterLookup} />);
  });

  it('removes unavailable rank filters when changing season', () => {
    clickOption('机智黄金');
    expect(characterNames()).toEqual(['杰瑞']);
    clickOption('S24');
    expect(characterNames()).toEqual(['海盗杰瑞', '蓝猫']);
    expect(screen.queryByRole('button', { name: '清除筛选' })).not.toBeInTheDocument();
    clickOption('S28');
    expect(screen.getByRole('button', { name: '机智黄金' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('retains supported ranks and faction selections across seasons', () => {
    clickOption('至尊传奇');
    clickOption('机智黄金');
    clickOption('猫阵营');
    clickOption('S24');
    expect(characterNames()).toEqual(['蓝猫']);
    expect(screen.getByRole('button', { name: '至尊传奇' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('clears rank and faction filters while preserving season, sorting and columns', () => {
    clickOption('S24');
    clickOption('至尊传奇');
    clickOption('猫阵营');
    clickOption('登场率');
    fireEvent.click(table().getByRole('columnheader', { name: '胜率 ↓' }));
    clickOption('清除筛选');
    expect(characterNames()).toEqual(['海盗杰瑞', '蓝猫']);
    expect(screen.getByRole('button', { name: 'S24' })).toHaveAttribute('aria-pressed', 'true');
    expect(table().getByRole('columnheader', { name: '胜率 ↑' })).toBeInTheDocument();
    expect(table().queryByRole('columnheader', { name: /登场率/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '清除筛选' })).not.toBeInTheDocument();
  });

  it('preserves historical labels and links to canonical IDs', () => {
    for (const [name, id] of [
      ['表演者▪杰瑞', '表演者•杰瑞'],
      ['海盗杰瑞', '航海士杰瑞'],
      ['大表哥', '蒙金奇'],
      ['蓝猫', '汤姆'],
    ] as const) {
      expect(table().getByRole('link', { name })).toHaveAttribute(
        'href',
        `/characters/${encodeURIComponent(id)}`
      );
    }
  });

  it('keeps missing ban rates last in both directions and preserves genuine zeroes', () => {
    clickOption('至尊传奇');
    clickOption('鼠阵营');
    fireEvent.click(table().getByRole('columnheader', { name: '禁用率 ↕' }));
    expect(characterNames()).toEqual(['海盗杰瑞', '大表哥', '表演者▪杰瑞']);
    fireEvent.click(table().getByRole('columnheader', { name: '禁用率 ↓' }));
    expect(characterNames()).toEqual(['大表哥', '海盗杰瑞', '表演者▪杰瑞']);
    expect(table().getByRole('cell', { name: '0.00%' })).toBeInTheDocument();
    expect(table().getByRole('cell', { name: '—' })).toBeInTheDocument();
    expect(screen.getByText('— 表示该条记录未提供禁用率数据。')).toBeInTheDocument();
  });

  it('hides unavailable ban rates and uses win-rate sorting until coverage returns', () => {
    fireEvent.click(table().getByRole('columnheader', { name: '禁用率 ↕' }));
    clickOption('S24');
    expect(table().queryByRole('columnheader', { name: /禁用率/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '禁用率' })).not.toBeInTheDocument();
    expect(screen.getByText('本赛季未提供禁用率数据。')).toBeInTheDocument();
    expect(table().getByRole('columnheader', { name: '胜率 ↓' })).toBeInTheDocument();
    clickOption('S28');
    expect(table().getByRole('columnheader', { name: '禁用率 ↓' })).toBeInTheDocument();
    clickOption('禁用率');
    clickOption('S24');
    clickOption('S28');
    expect(table().queryByRole('columnheader', { name: /禁用率/ })).not.toBeInTheDocument();
  });

  it('exports missing ban rates as empty cells and omits the column when unavailable', async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const createUrl = jest.fn((_blob: Blob) => 'blob:export');
    URL.createObjectURL = createUrl;
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const exportCsv = async () => {
      fireEvent.click(screen.getByRole('button', { name: '导出当前表格为 CSV' }));
      const blob = createUrl.mock.lastCall![0];
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
      });
    };

    try {
      clickOption('至尊传奇');
      clickOption('鼠阵营');
      const csv = await exportCsv();
      expect(csv).toContain('角色,登场率,胜率,禁用率');
      expect(csv).toContain('表演者▪杰瑞,3.00%,70.00%,\n');
      expect(csv).toContain('大表哥,1.00%,60.00%,0.00%');
      clickOption('S24');
      expect(await exportCsv()).toBe(
        'No.,段位,阵营,角色,登场率,胜率\n1,至尊传奇,鼠阵营,海盗杰瑞,3.00%,40.00%'
      );
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });
});
