import { readFileSync } from 'fs';

describe('game-data import boundaries', () => {
  it('does not re-export the mutable edit store from the data barrel', () => {
    const source = readFileSync('src/data/index.ts', 'utf8');

    expect(source).not.toMatch(/(?:export|import)[\s\S]*?from ['"]\.\/store['"]/);
    expect(source).not.toContain("export * from './store'");
  });
});
