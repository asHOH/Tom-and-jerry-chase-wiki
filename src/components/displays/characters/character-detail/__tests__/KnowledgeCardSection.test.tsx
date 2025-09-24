/* eslint-disable @typescript-eslint/no-explicit-any */
import { characters } from '@/data';

describe('KnowledgeCard nested persistence (sanity tests)', () => {
  const charId = 'test-char-for-knowledgecard-section';

  beforeEach(() => {
    // reset test character in the Valtio characters store
    // minimal shape used by the components
    (characters as any)[charId] = {
      id: charId,
      knowledgeCardGroups: [
        {
          id: 'preset-1',
          description: 'preset desc',
          detailedDescription: 'detailed',
          defaultFolded: false,
          groups: [
            { cards: ['cat-1'], description: 'g1' },
            { cards: ['cat-2'], description: 'g2' },
          ],
        },
      ],
    };
  });

  afterEach(() => {
    // cleanup
    delete (characters as any)[charId];
  });

  test('writing nested group cards updates the Valtio characters store', () => {
    // sanity write following the example pattern from implementation plan
    (characters as any)[charId]!.knowledgeCardGroups[0]!.groups[1]!.cards = Array.from(['cat-99']);

    expect((characters as any)[charId]!.knowledgeCardGroups[0]!.groups[1]!.cards).toEqual([
      'cat-99',
    ]);
  });

  test('updating group-set metadata persists to characters store', () => {
    (characters as any)[charId]!.knowledgeCardGroups[0]!.id = 'preset-1-renamed';
    (characters as any)[charId]!.knowledgeCardGroups[0]!.description = 'updated desc';
    (characters as any)[charId]!.knowledgeCardGroups[0]!.defaultFolded = true;

    expect((characters as any)[charId]!.knowledgeCardGroups[0]!.id).toBe('preset-1-renamed');
    expect((characters as any)[charId]!.knowledgeCardGroups[0]!.description).toBe('updated desc');
    expect((characters as any)[charId]!.knowledgeCardGroups[0]!.defaultFolded).toBe(true);
  });
});
