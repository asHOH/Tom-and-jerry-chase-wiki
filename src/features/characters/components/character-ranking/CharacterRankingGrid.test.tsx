import { createElement, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { characters } from '@/data/static';
import { rankCharactersByProperty } from '@/features/characters/utils/ranking';

import CharacterRankingGrid from './CharacterRankingGrid';

let faction: string | null = null;
let query = '';

jest.mock('next/navigation', () => ({
  useSearchParams: () => {
    const params = new URLSearchParams(query);
    if (faction) params.set('faction', faction);
    return params;
  },
}));
jest.mock('@/hooks/usePublishedRevision', () => ({ usePublishedRevision: jest.fn() }));
jest.mock('@/hooks/useEditableGameData', () => ({
  useEditableDomain: (_type: string, data: unknown) => [data, jest.fn()],
}));
jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => createElement('a', props),
}));
jest.mock('@/components/ui/CatalogGrid', () => ({
  CatalogGrid: ({ items }: { items: ReactNode[] }) => <div>{items}</div>,
  CatalogGridItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock('./CharacterRankingCard', () => ({
  __esModule: true,
  default: () => <div>角色卡片</div>,
}));
jest.mock('./PropertySelector', () => ({
  __esModule: true,
  default: ({ onPropertyChange }: { onPropertyChange: (property: 'moveSpeed') => void }) => (
    <button onClick={() => onPropertyChange('moveSpeed')}>按移速排名</button>
  ),
}));

const cat = characters['汤姆']!;
const mouse = characters['杰瑞']!;
const data = { [cat.id]: cat, [mouse.id]: mouse };

beforeEach(() => {
  faction = null;
  query = '';
});

it('switches views, customizes columns, and preserves the ranking and choices', () => {
  render(<CharacterRankingGrid initialProperty='maxHp' data={data} />);
  expect(screen.getAllByText('角色卡片')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: '表格视图' }));

  const table = screen.getByRole('table', { name: '角色属性排行榜' });
  expect(within(table).getByRole('columnheader', { name: 'Hp上限' })).toBeInTheDocument();
  expect(
    within(table)
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getByRole('rowheader').textContent)
  ).toEqual(rankCharactersByProperty([cat, mouse], 'maxHp').map(({ character }) => character.id));
  expect(within(table).getByRole('link', { name: cat.id })).toHaveAttribute(
    'href',
    `/characters/${cat.id}`
  );

  fireEvent.click(screen.getByText('自定义显示属性'));
  expect(screen.getByRole('button', { name: '隐藏Hp上限列' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '显示爪刀CD(命中)列' }));
  expect(within(table).getByRole('columnheader', { name: '爪刀CD(命中)' })).toBeInTheDocument();
  const catRow = within(table).getByRole('rowheader', { name: cat.id }).closest('tr')!;
  const mouseRow = within(table).getByRole('rowheader', { name: mouse.id }).closest('tr')!;
  const catValue = rankCharactersByProperty([cat], 'clawKnifeCdHit')[0]!.formattedValue;
  expect(within(catRow).getByText(catValue)).toBeInTheDocument();
  expect(within(mouseRow).getByText('—')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '卡片视图' }));
  fireEvent.click(screen.getByRole('button', { name: '表格视图' }));
  expect(screen.getByRole('columnheader', { name: '爪刀CD(命中)' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '按移速排名' }));
  expect(screen.getByRole('columnheader', { name: '移速' })).toBeInTheDocument();
  expect(
    screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getByRole('rowheader').textContent)
  ).toEqual(
    rankCharactersByProperty([cat, mouse], 'moveSpeed').map(({ character }) => character.id)
  );
});

it('limits available columns and rows to the selected faction', () => {
  faction = 'mouse';
  render(<CharacterRankingGrid initialProperty='maxHp' data={data} />);
  fireEvent.click(screen.getByRole('button', { name: '表格视图' }));
  fireEvent.click(screen.getByText('自定义显示属性'));
  expect(screen.queryByRole('button', { name: '显示爪刀CD(命中)列' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '显示推速列' })).toBeInTheDocument();
  expect(screen.getByRole('rowheader', { name: mouse.id })).toBeInTheDocument();
  expect(screen.queryByRole('rowheader', { name: cat.id })).not.toBeInTheDocument();
});

it('restores the table and valid columns when arriving from another ranking', () => {
  query = 'view=table&column=clawKnifeCdHit&column=invalid';
  render(<CharacterRankingGrid initialProperty='maxHp' data={data} />);
  expect(screen.getByRole('button', { name: '表格视图' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('columnheader', { name: '爪刀CD(命中)' })).toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: 'invalid' })).not.toBeInTheDocument();
});

it('displays text properties from the current character data and actor profiles', () => {
  const editedCat = {
    ...cat,
    EnglishName: 'Edited Tom',
    catPositioningTags: [
      { tagName: '进攻' as const, level: 4 as const, description: '', additionalDescription: '' },
      { tagName: '防守' as const, level: 1 as const, description: '', additionalDescription: '' },
    ],
  };
  const { EnglishName: _englishName, ...mouseWithoutEnglishName } = mouse;
  const editedMouse = { ...mouseWithoutEnglishName, aliases: [] };
  render(
    <CharacterRankingGrid
      initialProperty='maxHp'
      data={{ [cat.id]: editedCat, [mouse.id]: editedMouse }}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: '表格视图' }));
  fireEvent.click(screen.getByText('自定义显示属性'));
  for (const label of ['阵营', '英文名', '角色定位', '性别', '初始道具', '主动技能']) {
    fireEvent.click(screen.getByRole('button', { name: `显示${label}列` }));
  }
  const table = screen.getByRole('table', { name: '角色属性排行榜' });
  const catRow = within(table).getByRole('rowheader', { name: cat.id }).closest('tr')!;
  const mouseRow = within(table).getByRole('rowheader', { name: mouse.id }).closest('tr')!;
  expect(within(catRow).getByText('猫阵营')).toBeInTheDocument();
  expect(within(catRow).getByText('Edited Tom')).toBeInTheDocument();
  expect(within(catRow).getByText('进攻')).toBeInTheDocument();
  expect(within(catRow).queryByText('防守')).not.toBeInTheDocument();
  expect(within(catRow).getByText('男性')).toBeInTheDocument();
  expect(within(catRow).getByText('老鼠夹')).toBeInTheDocument();
  expect(
    within(catRow).getByText(cat.skills.find((skill) => skill.type === 'active')!.name)
  ).toBeInTheDocument();
  expect(within(mouseRow).getAllByText('—').length).toBeGreaterThanOrEqual(2);
  expect(screen.queryByRole('button', { name: '显示别名列' })).not.toBeInTheDocument();
});

it('restores text columns from the ranking URL', () => {
  query = 'view=table&column=sex&column=EnglishName';
  render(<CharacterRankingGrid initialProperty='maxHp' data={data} />);
  expect(screen.getByRole('columnheader', { name: '性别' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: '英文名' })).toBeInTheDocument();
});

it('allows hiding rank and the ranking property and moving any visible column', () => {
  render(<CharacterRankingGrid initialProperty='maxHp' data={data} />);
  fireEvent.click(screen.getByRole('button', { name: '表格视图' }));
  fireEvent.click(screen.getByText('自定义显示属性'));
  const table = screen.getByRole('table', { name: '角色属性排行榜' });
  fireEvent.click(screen.getByRole('button', { name: '隐藏排名列' }));
  fireEvent.click(screen.getByRole('button', { name: '隐藏Hp上限列' }));
  fireEvent.click(screen.getByRole('button', { name: '显示性别列' }));
  expect(
    within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
  ).toEqual(['角色', '性别']);
  fireEvent.keyDown(screen.getByRole('button', { name: '性别列，第2位，共2列' }), {
    key: 'ArrowLeft',
  });
  expect(
    within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
  ).toEqual(['性别', '角色']);
  const catRow = within(table).getByRole('rowheader', { name: cat.id }).closest('tr')!;
  expect(Array.from(catRow.cells).map((cell) => cell.textContent)).toEqual(['男性', cat.id]);
  fireEvent.click(screen.getByRole('button', { name: '性别列，第1位，共2列' }));
  expect(screen.getByRole('button', { name: '性别列，第1位，共2列' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  fireEvent.click(screen.getByRole('button', { name: '角色列，第2位，共2列' }));
  expect(
    within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
  ).toEqual(['角色', '性别']);
  fireEvent.click(screen.getByRole('button', { name: '角色列，第1位，共2列' }));
  fireEvent.click(screen.getByRole('button', { name: '性别列，第2位，共2列' }));
  fireEvent.click(screen.getByRole('button', { name: '按移速排名' }));
  expect(within(table).queryByRole('columnheader', { name: '移速' })).not.toBeInTheDocument();
  expect(
    within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
  ).toEqual(['性别', '角色']);
  fireEvent.click(screen.getByRole('button', { name: '显示移速列' }));
  fireEvent.click(screen.getByRole('button', { name: '显示排名列' }));
  expect(within(table).getByRole('columnheader', { name: '移速' })).toBeInTheDocument();
  expect(within(table).getByRole('columnheader', { name: '排名' })).toBeInTheDocument();
});

it('restores ordered columns and hidden rank fields from a custom layout', () => {
  query = 'view=table&layout=custom&column=sex&column=character&column=aliases&column=sex';
  render(<CharacterRankingGrid initialProperty='maxHp' data={data} />);
  const table = screen.getByRole('table', { name: '角色属性排行榜' });
  expect(
    within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
  ).toEqual(['性别', '角色']);
  expect(screen.queryByText('表格可左右滑动；— 表示该角色没有此属性。')).not.toBeInTheDocument();
  expect(screen.queryByText('当前排名属性始终显示，可选择其他属性')).not.toBeInTheDocument();
});

it('lets users remove every displayed column and restore a hidden column', () => {
  render(<CharacterRankingGrid initialProperty='maxHp' data={data} />);
  fireEvent.click(screen.getByRole('button', { name: '表格视图' }));
  fireEvent.click(screen.getByText('自定义显示属性'));
  const displayed = screen.getByRole('list', { name: '显示列' });
  expect(within(displayed).getAllByRole('listitem')).toHaveLength(3);
  for (const label of ['排名', '角色', 'Hp上限']) {
    fireEvent.click(within(displayed).getByRole('button', { name: `隐藏${label}列` }));
    expect(
      within(screen.getByRole('group', { name: '隐藏列' })).getByRole('button', {
        name: `显示${label}列`,
      })
    ).toBeInTheDocument();
  }
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '显示角色列' }));
  expect(screen.getByRole('columnheader', { name: '角色' })).toBeInTheDocument();
  expect(within(displayed).getByRole('button', { name: '隐藏角色列' })).toBeInTheDocument();
});

it('restores a custom layout without adding the character column', () => {
  query = 'view=table&layout=custom&column=sex';
  render(<CharacterRankingGrid initialProperty='maxHp' data={data} />);
  expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['性别']);
});

it('exports the visible columns in their current order and includes displayed text and missing values', async () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const createUrl = jest.fn((_blob: Blob) => 'blob:ranking');
  URL.createObjectURL = createUrl;
  URL.revokeObjectURL = jest.fn();
  let filename = '';
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    filename = this.download;
  });
  const editedCat = { ...cat, EnglishName: 'Tom, "the"\ncat' };
  const { EnglishName: _englishName, ...editedMouse } = mouse;
  try {
    render(
      <CharacterRankingGrid
        initialProperty='maxHp'
        data={{ [cat.id]: editedCat, [mouse.id]: editedMouse }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '表格视图' }));
    fireEvent.click(screen.getByText('自定义显示属性'));
    expect(
      screen.queryByText('拖动或依次点击两列调整顺序，也可使用键盘方向键')
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '隐藏排名列' }));
    fireEvent.click(screen.getByRole('button', { name: '隐藏Hp上限列' }));
    fireEvent.click(screen.getByRole('button', { name: '显示英文名列' }));
    fireEvent.keyDown(screen.getByRole('button', { name: '英文名列，第2位，共2列' }), {
      key: 'ArrowLeft',
    });
    fireEvent.click(screen.getByRole('button', { name: '导出角色排名为 CSV' }));
    const blob = createUrl.mock.lastCall![0];
    const csv = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    const expectedRows = rankCharactersByProperty([editedCat, editedMouse], 'maxHp').map(
      ({ character }) => (character.id === cat.id ? '"Tom, ""the""\ncat",汤姆' : '—,杰瑞')
    );
    expect(csv).toBe(['英文名,角色', ...expectedRows].join('\r\n'));
    expect(blob.type).toBe('text/csv;charset=utf-8');
    expect(filename).toBe('角色属性排行榜_Hp上限.csv');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:ranking');
    fireEvent.click(screen.getByRole('button', { name: '隐藏英文名列' }));
    fireEvent.click(screen.getByRole('button', { name: '隐藏角色列' }));
    expect(screen.getByRole('button', { name: '导出角色排名为 CSV' })).toBeDisabled();
  } finally {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    click.mockRestore();
  }
});
