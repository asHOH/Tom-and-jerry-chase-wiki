import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

import { StorageKey } from '@/lib/localStorage';
import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';

import PositioningTagsSection from './PositioningTagsSection';

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

jest.mock('../PublishedCharacterContext', () => {
  const character = { id: '测试角色', skills: [] };
  return {
    usePublishedCharacter: () => character,
  };
});

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
    expect(screen.queryByRole('button', { name: /定位.*视图/ })).not.toBeInTheDocument();
  });

  it.each([
    ['bar', 'positioning-bar-chart'],
    ['radar', 'positioning-radar-chart'],
  ] as const)('uses the stored %s chart preference', async (mode, testId) => {
    localStorage.setItem(StorageKey.PositioningTagView, `"${mode}"`);
    render(<PositioningTagsSection tags={tags} factionId='cat' />);

    expect(await screen.findByTestId(testId)).toBeInTheDocument();
  });

  it('uses the same positioning tag tooltip content for chart labels', () => {
    localStorage.setItem(StorageKey.PositioningTagView, '"bar"');
    render(<PositioningTagsSection tags={tags} factionId='cat' />);

    expect(mockGetPositioningTagTooltipContent).toHaveBeenCalledWith('进攻', 'cat', false);
  });

  it('normalizes an invalid stored view to text', () => {
    localStorage.setItem(StorageKey.PositioningTagView, '"invalid"');

    render(<PositioningTagsSection tags={tags} factionId='cat' />);

    expect(screen.getByText('进攻说明')).toBeInTheDocument();
  });

  it('forces text editing while preserving the saved chart view', () => {
    localStorage.setItem(StorageKey.PositioningTagView, '"radar"');
    mockIsEditMode = true;

    const { rerender } = render(<PositioningTagsSection tags={tags} factionId='cat' />);

    expect(screen.getByText('进攻说明')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /定位.*视图/ })).not.toBeInTheDocument();

    mockIsEditMode = false;
    rerender(<PositioningTagsSection tags={tags} factionId='cat' />);

    expect(screen.getByTestId('positioning-radar-chart')).toBeInTheDocument();
  });
});
