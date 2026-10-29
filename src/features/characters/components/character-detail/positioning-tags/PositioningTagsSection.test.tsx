import { type ReactNode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { StorageKey } from '@/lib/localStorage';
import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useEditableEntity } from '@/hooks/useEditableGameData';
import { getPositioningTagKey, getPositioningTagNames } from '@/constants/positioningTagSequences';
import { characters } from '@/data/static';
import type { CatPositioningTagName } from '@/data/types';
import { clearTestEditSession, installTestEditSession } from '@/testUtils/editRuntime';

import PositioningTagsSection from './PositioningTagsSection';

let mockIsEditMode = false;

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({ isDetailedView: false }),
}));

jest.mock('@/context/DarkModeContext', () => ({
  useDarkMode: () => [false, jest.fn()] as const,
}));

jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => ({
    isEditMode: mockIsEditMode,
    isEditModeRequested: mockIsEditMode,
    runtimeStatus: 'ready',
  }),
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

describe('PositioningTagsSection editing', () => {
  let session: ReturnType<typeof installTestEditSession>;
  const ref = { entityType: 'characters', entityId: '测试角色' } as const;
  type CatTags = NonNullable<(typeof characters)[string]['catPositioningTags']>;

  function Editor() {
    const [character] = useEditableEntity(ref, null);
    return <PositioningTagsSection tags={character?.catPositioningTags ?? []} factionId='cat' />;
  }

  function startEditor(initialTags: CatTags) {
    session = installTestEditSession({
      characters: {
        测试角色: { ...characters.汤姆!, id: '测试角色', catPositioningTags: initialTags },
      },
    });
    render(<Editor />);
  }

  const readTags = () => session.readEntity(ref)!.catPositioningTags!;
  const allTags = getPositioningTagNames('cat').map((tagName) => ({
    ...tags[0]!,
    tagName: tagName as CatPositioningTagName,
  }));

  beforeEach(() => {
    mockIsEditMode = true;
    localStorage.clear();
  });
  afterEach(() => {
    clearTestEditSession(session);
    mockIsEditMode = false;
  });

  it('adds unused names and then separate weapon entries', async () => {
    startEditor([]);
    for (let index = 0; index < allTags.length + 1; index += 1) {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '添加定位标签' }));
      });
    }
    expect(
      readTags()
        .slice(0, allTags.length)
        .map((tag) => tag.tagName)
    ).toEqual(getPositioningTagNames('cat'));
    expect(readTags().at(-1)).toMatchObject({ tagName: '进攻', weapon: 1 });
    expect(new Set(readTags().map(getPositioningTagKey)).size).toBe(allTags.length + 1);
  });

  it('disables add when all available weapon scopes are occupied', () => {
    const full = ([undefined, 1, 2] as const).flatMap((weapon) =>
      allTags.map((tag) => ({ ...tag, ...(weapon === undefined ? {} : { weapon }) }))
    );
    startEditor(full);
    const button = screen.getByRole('button', { name: '添加定位标签' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(readTags()).toEqual(full);
  });

  it('blocks a rename collision and allows the same name for another weapon', async () => {
    startEditor([
      { ...tags[0]!, weapon: 1 },
      { ...tags[1]!, weapon: 1 },
      { ...tags[1]!, weapon: 2 },
    ]);
    const names = screen.getAllByRole('combobox', { name: '选择标签名称' });
    expect(within(names[1]!).getByRole('option', { name: '进攻' })).toBeDisabled();
    expect(within(names[2]!).getByRole('option', { name: '进攻' })).toBeEnabled();
    await act(async () => {
      fireEvent.change(names[1]!, { target: { value: '进攻' } });
    });
    expect(readTags()[1]!.tagName).toBe('翻盘');
    await act(async () => {
      fireEvent.change(names[2]!, { target: { value: '进攻' } });
    });
    expect(readTags()[2]).toMatchObject({ tagName: '进攻', weapon: 2 });
  });

  it('targets identical-looking weapon entries correctly and blocks scope collisions', async () => {
    startEditor([{ ...tags[0]!, weapon: 1 }, { ...tags[0]!, weapon: 2 }, tags[0]!]);
    const weapons = screen.getAllByRole('combobox', { name: '选择武器' });
    expect(within(weapons[1]!).getByRole('option', { name: '无武器' })).toBeDisabled();
    await act(async () => {
      fireEvent.change(weapons[1]!, { target: { value: '1' } });
    });
    expect(readTags()[1]!.weapon).toBe(2);
    await act(async () => {
      fireEvent.change(screen.getAllByRole('combobox', { name: '选择标签等级' })[1]!, {
        target: { value: '3' },
      });
    });
    expect(readTags().map((tag) => tag.level)).toEqual([4, 3, 4]);
    // Sorting now places weapon 2 last; remove that exact row.
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: '移除定位标签' })[2]!);
    });
    expect(readTags().map((tag) => tag.weapon)).toEqual([1, undefined]);
  });

  it('allows a legacy duplicate to be removed', async () => {
    startEditor([{ ...tags[0]! }, { ...tags[0]!, description: 'duplicate' }]);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: '移除定位标签' })[1]!);
    });
    expect(readTags()).toEqual([tags[0]]);
  });
});
