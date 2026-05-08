import { render, waitFor } from '@testing-library/react';

import { characters } from '@/data';

import { usePersistentGameStore } from './usePersistentGameStore';

const TEST_CHARACTER_ID = '__persistent_store_test_character__';

const HookHarness = () => {
  usePersistentGameStore();
  return null;
};

describe('usePersistentGameStore', () => {
  afterEach(() => {
    delete (characters as Record<string, unknown>)[TEST_CHARACTER_ID];
    window.localStorage.clear();
  });

  it('should hydrate the character store from localStorage when mounted', async () => {
    window.localStorage.setItem(
      'characters',
      JSON.stringify({
        [TEST_CHARACTER_ID]: {
          id: TEST_CHARACTER_ID,
          description: 'persisted test character',
        },
      })
    );

    render(<HookHarness />);

    await waitFor(() => {
      expect((characters as Record<string, unknown>)[TEST_CHARACTER_ID]).toMatchObject({
        id: TEST_CHARACTER_ID,
        description: 'persisted test character',
      });
    });
  });
});
