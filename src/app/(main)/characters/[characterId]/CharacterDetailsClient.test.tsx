import { createContext, type ReactNode } from 'react';
import { render } from '@testing-library/react';

import type { ActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import type { CharacterWithFaction } from '@/lib/types';
import { clearTestEditRuntime, installTestEditRuntime } from '@/testUtils/editRuntime';

import CharacterDetailsClient from './CharacterDetailsClient';

const mockExitEditMode = jest.fn();
const mockUseEditMode = jest.fn();
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
  usePageEditMode: () => ({
    isDirty: false,
    isPublishing: false,
    draftInfo: null,
    draftsSummary: [],
    advancedSubmit: { available: false, defaultOutcome: 'pending' as const, modes: ['default'] },
    discardChanges: jest.fn(),
    publishChanges: jest.fn(),
    getActionCount: () => 0,
  }),
}));

jest.mock('@/hooks/useContributionSubmissionFeedback', () => ({
  useContributionSubmissionFeedback: () => jest.fn(),
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
  default: () => null,
}));

describe('CharacterDetailsClient', () => {
  let runtime: ActiveEditRuntime;
  let characters: ActiveEditRuntime['stores']['characters'];

  beforeEach(() => {
    runtime = installTestEditRuntime();
    characters = runtime.stores.characters;
    mockExitEditMode.mockReset();
    mockUseEditMode.mockReturnValue({ isEditMode: false });

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
    clearTestEditRuntime(runtime);
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
});
