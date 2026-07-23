import { type ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';

import PositioningTagsSection from './PositioningTagsSection';
import { POSITIONING_TAG_VIEW_STORAGE_KEY } from './positioningTagViewModel';

let mockIsEditMode = false;

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({ isDetailedView: false }),
}));

jest.mock('@/context/DarkModeContext', () => ({
  useDarkMode: () => [false, jest.fn()] as const,
}));

jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => ({ isEditMode: mockIsEditMode }),
}));

jest.mock('@/hooks/useLocalEditEntity', () => ({
  useLocalCharacter: () => ({ characterId: '测试角色' }),
}));

jest.mock('@/data', () => ({
  characters: (() => {
    const { proxy } = jest.requireActual<typeof import('valtio')>('valtio');
    return proxy({ 测试角色: proxy({ id: '测试角色', skills: [] }) });
  })(),
}));

jest.mock('@/lib/design', () => ({
  cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
  getPositioningTagColors: () => ({
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  }),
  getPositioningTagContainerColor: () => 'border',
}));

jest.mock('@/lib/editUtils', () => ({
  setNestedProperty: jest.fn(),
}));

jest.mock('@/lib/tooltipUtils', () => ({
  getPositioningTagTooltipContent: jest.fn(() => '定位标签说明'),
}));

jest.mock('@/features/characters/utils/weapons', () => ({
  getWeaponSkillImageUrl: () => undefined,
}));

jest.mock('@/components/ui/editable', () => ({
  editable: () => ({
    p: ({ initialValue }: { initialValue: string }) => <p>{initialValue}</p>,
  }),
}));

jest.mock('@/components/ui/IconButton', () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
    <button type='button' {...props}>
      {children}
    </button>
  ),
  getIconButtonIconClassName: () => 'icon',
}));

jest.mock('@/components/ui/Tag', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/icons/CommonIcons', () => ({
  PlusIcon: () => <span />,
  TrashIcon: () => <span />,
}));

jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: () => <span />,
}));

const tags = [
  {
    tagName: '进攻' as const,
    level: 4 as const,
    description: '进攻说明',
    additionalDescription: '',
  },
  {
    tagName: '翻盘' as const,
    level: 2 as const,
    description: '翻盘说明',
    additionalDescription: '',
  },
];

const mockGetPositioningTagTooltipContent = jest.mocked(getPositioningTagTooltipContent);

describe('PositioningTagsSection views', () => {
  beforeEach(() => {
    mockIsEditMode = false;
    localStorage.clear();
  });

  it('defaults to the original text view', () => {
    render(<PositioningTagsSection tags={tags} factionId='cat' />);

    expect(screen.getByText('进攻说明')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '定位文本视图' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.queryByRole('button', { name: '定位雷达图视图' })).not.toBeInTheDocument();
  });

  it.each([
    ['bar', 'positioning-bar-chart'],
    ['rose', 'positioning-rose-chart'],
  ] as const)('switches to the %s chart and persists the choice', async (mode, testId) => {
    render(<PositioningTagsSection tags={tags} factionId='cat' />);

    const labels = { bar: '柱状图', rose: '玫瑰图' } as const;
    fireEvent.click(screen.getByRole('button', { name: `定位${labels[mode]}视图` }));

    expect(screen.getByTestId(testId)).toBeInTheDocument();
    await waitFor(() =>
      expect(localStorage.getItem(POSITIONING_TAG_VIEW_STORAGE_KEY)).toBe(`"${mode}"`)
    );
  });

  it('uses the same positioning tag tooltip content for chart labels', () => {
    render(<PositioningTagsSection tags={tags} factionId='cat' />);

    fireEvent.click(screen.getByRole('button', { name: '定位柱状图视图' }));

    expect(mockGetPositioningTagTooltipContent).toHaveBeenCalledWith('进攻', 'cat', false);
  });

  it('normalizes an invalid stored view to text', async () => {
    localStorage.setItem(POSITIONING_TAG_VIEW_STORAGE_KEY, '"invalid"');

    render(<PositioningTagsSection tags={tags} factionId='cat' />);

    expect(screen.getByText('进攻说明')).toBeInTheDocument();
    await waitFor(() =>
      expect(localStorage.getItem(POSITIONING_TAG_VIEW_STORAGE_KEY)).toBe('"text"')
    );
  });

  it('forces text editing while preserving the saved chart view', () => {
    localStorage.setItem(POSITIONING_TAG_VIEW_STORAGE_KEY, '"rose"');
    mockIsEditMode = true;

    const { rerender } = render(<PositioningTagsSection tags={tags} factionId='cat' />);

    expect(screen.getByText('进攻说明')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '定位文本视图' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '定位玫瑰图视图' })).toBeDisabled();

    mockIsEditMode = false;
    rerender(<PositioningTagsSection tags={tags} factionId='cat' />);

    expect(screen.getByTestId('positioning-rose-chart')).toBeInTheDocument();
  });
});
