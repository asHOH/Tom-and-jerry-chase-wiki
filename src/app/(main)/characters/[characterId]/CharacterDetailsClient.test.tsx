import { createContext, type ReactNode } from 'react';
import { act, render } from '@testing-library/react';

import type { CharacterWithFaction } from '@/lib/types';
import { characters } from '@/data';

import CharacterDetailsClient from './CharacterDetailsClient';

const mockExitEditMode = jest.fn();
const mockUseEditMode = jest.fn();
const mockCharacterDiscard = jest.fn();
const mockCharacterPublish = jest.fn();
const mockRelationDiscard = jest.fn();
const mockRelationPublish = jest.fn();
const mockEditModeToolbar = jest.fn((_props: unknown) => null);
const mockCharacterEditMode = {
  isDirty: false,
  isPublishing: false,
  draftsSummary: [] as Array<{ entityType: string }>,
  discardChanges: mockCharacterDiscard,
  publishChanges: mockCharacterPublish,
  getActionCount: () => 0,
};
const mockRelationEditMode = {
  isDirty: false,
  isPublishing: false,
  draftInfo: null,
  draftsSummary: [] as Array<{
    entityType: 'characterRelations';
    entityLabel: string;
    entityId: string;
    itemLabel: string;
    count: number;
  }>,
  discardChanges: mockRelationDiscard,
  publishChanges: mockRelationPublish,
  getActionCount: () => 0,
};
const TEST_CHARACTER_ID = '__character_details_client_character__';

jest.mock('@/context/EditModeContext', () => {
  const MockEditModeContext = createContext<unknown>(undefined);
  MockEditModeContext.displayName = 'MockEditModeContext';
  return {
    EditModeContext: MockEditModeContext,
    useEditMode: () => mockUseEditMode(),
  };
});

jest.mock('@/hooks/useLocalEditEntity', () => ({
  useLocalCharacter: () => ({ characterId: 'Tom' }),
}));

jest.mock('@/hooks/usePageEditMode', () => ({
  usePageEditMode: () => mockCharacterEditMode,
}));

jest.mock('@/features/character-relations/matrix/useRelationMatrixEditMode', () => ({
  useRelationMatrixEditMode: () => mockRelationEditMode,
}));

jest.mock('@/hooks/useSearchParamEditMode', () => ({
  useSearchParamEditMode: () => ({ exitEditMode: mockExitEditMode }),
}));

jest.mock('@/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: jest.fn(),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ info: jest.fn() }),
}));

jest.mock('@/features/characters/components/character-detail', () => ({
  CharacterDetails: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/EditModeToolbar', () => ({
  __esModule: true,
  default: (props: unknown) => mockEditModeToolbar(props),
}));

jest.mock('@/components/OnboardingTutorial', () => ({
  __esModule: true,
  default: () => null,
}));

describe('CharacterDetailsClient', () => {
  let snapshot: Record<string, unknown>;

  beforeEach(() => {
    snapshot = structuredClone(characters) as Record<string, unknown>;
    mockExitEditMode.mockReset();
    mockCharacterDiscard.mockReset();
    mockCharacterPublish.mockReset();
    mockRelationDiscard.mockReset();
    mockRelationPublish.mockReset();
    mockEditModeToolbar.mockClear();
    mockCharacterEditMode.isDirty = false;
    mockCharacterEditMode.getActionCount = () => 0;
    mockCharacterEditMode.draftsSummary = [];
    mockRelationEditMode.isDirty = false;
    mockRelationEditMode.getActionCount = () => 0;
    mockRelationEditMode.draftsSummary = [];
    mockUseEditMode.mockReturnValue({
      isEditMode: false,
      isLoading: false,
      isPreviewMode: false,
      setIsPreviewMode: jest.fn(),
    });

    (characters as Record<string, CharacterWithFaction>)[TEST_CHARACTER_ID] = {
      id: TEST_CHARACTER_ID,
      description: 'canonical props',
      factionId: 'cat',
      imageUrl: '',
      createDate: null,
      skills: [],
      knowledgeCardGroups: [],
    } as CharacterWithFaction;
  });

  afterEach(() => {
    Object.keys(characters).forEach((key) => {
      delete (characters as Record<string, unknown>)[key];
    });
    Object.entries(snapshot).forEach(([key, value]) => {
      (characters as Record<string, unknown>)[key] = value;
    });
  });

  it('does not overwrite existing character store data when not in edit mode', () => {
    const characterStore = characters as Record<string, { description?: string }>;
    characterStore[TEST_CHARACTER_ID]!.description = 'public update';

    render(
      <CharacterDetailsClient
        character={{
          id: TEST_CHARACTER_ID,
          description: 'canonical props',
          factionId: 'cat',
          imageUrl: '',
          createDate: null,
          skills: [],
          knowledgeCardGroups: [],
        }}
      />
    );

    expect(characterStore[TEST_CHARACTER_ID]!.description).toBe('public update');
  });

  it('includes canonical relation drafts in character detail edit controls', async () => {
    mockUseEditMode.mockReturnValue({
      isEditMode: true,
      isLoading: false,
      isPreviewMode: false,
      setIsPreviewMode: jest.fn(),
    });
    mockRelationEditMode.isDirty = true;
    mockRelationEditMode.getActionCount = () => 1;
    mockRelationEditMode.draftsSummary = [
      {
        entityType: 'characterRelations',
        entityLabel: '角色关系',
        entityId: 'relation-key',
        itemLabel: '杰瑞 → 汤姆',
        count: 1,
      },
    ];
    mockRelationPublish.mockResolvedValue(true);

    render(
      <CharacterDetailsClient
        character={{
          id: TEST_CHARACTER_ID,
          description: 'canonical props',
          factionId: 'cat',
          imageUrl: '',
          createDate: null,
          skills: [],
          knowledgeCardGroups: [],
        }}
      />
    );

    const toolbarProps = mockEditModeToolbar.mock.calls.at(-1)?.[0] as {
      isDirty: boolean;
      actionCount: number;
      draftsSummary: Array<{ entityType: string }>;
      onDiscard: () => void;
      onPublish: (message?: string) => Promise<boolean>;
    };
    expect(toolbarProps.isDirty).toBe(true);
    expect(toolbarProps.actionCount).toBe(1);
    expect(toolbarProps.draftsSummary).toEqual(mockRelationEditMode.draftsSummary);

    toolbarProps.onDiscard();
    expect(mockRelationDiscard).toHaveBeenCalledTimes(1);
    await act(async () => {
      await expect(toolbarProps.onPublish('关系更新')).resolves.toBe(true);
    });
    expect(mockRelationPublish).toHaveBeenCalledWith('关系更新');
    expect(mockCharacterPublish).not.toHaveBeenCalled();
  });
});
