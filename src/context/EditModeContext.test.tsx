import { useSearchParams } from 'next/navigation';
import { render, waitFor } from '@testing-library/react';

import { getActionsStorageKey } from '@/lib/edit/diffUtils';
import { characters } from '@/data';

import { EditModeProvider } from './EditModeContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: jest.fn(),
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const TEST_CHARACTER_ID = '__edit_mode_draft_replay_character__';

const renderEditModeProvider = () => {
  render(
    <EditModeProvider>
      <div />
    </EditModeProvider>
  );
};

describe('EditModeProvider', () => {
  let characterSnapshot: Record<string, unknown>;

  beforeEach(() => {
    characterSnapshot = structuredClone(characters) as Record<string, unknown>;
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('edit=1') as ReturnType<typeof useSearchParams>
    );
    window.localStorage.clear();
  });

  afterEach(() => {
    Object.keys(characters).forEach((key) => {
      delete (characters as Record<string, unknown>)[key];
    });
    Object.entries(characterSnapshot).forEach(([key, value]) => {
      (characters as Record<string, unknown>)[key] = value;
    });
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('should restore character drafts from editmode action history when entering edit mode', async () => {
    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.description`,
          oldValue: undefined,
          newValue: 'restored draft description',
        },
      ])
    );

    renderEditModeProvider();

    await waitFor(() => {
      expect((characters as Record<string, { description?: string }>)[TEST_CHARACTER_ID]).toEqual({
        description: 'restored draft description',
      });
    });
  });

  it('should warn when a draft action history is large', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify(
        Array.from({ length: 1001 }, (_, index) => ({
          op: 'set',
          path: `${TEST_CHARACTER_ID}.description`,
          oldValue: index === 0 ? undefined : `draft ${index - 1}`,
          newValue: `draft ${index}`,
        }))
      )
    );

    renderEditModeProvider();

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Large edit mode draft history'),
        expect.objectContaining({
          entityType: 'characters',
          entries: 1001,
        })
      );
    });
  });
});
