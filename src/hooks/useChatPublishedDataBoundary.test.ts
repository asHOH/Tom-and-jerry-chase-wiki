import { readFileSync } from 'fs';

describe('useChat published game-data boundary', () => {
  it('loads editable game data lazily instead of importing the static graph', () => {
    const source = readFileSync('src/hooks/useChat.ts', 'utf8');

    expect(source).toContain('fetchPublishedChatGameData');
    expect(source).not.toContain("from '@/data/static'");
  });
});
