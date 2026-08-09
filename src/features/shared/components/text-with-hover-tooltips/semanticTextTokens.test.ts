import { buildSemanticTextTokens } from './semanticTextTokens';

const compactTokens = (text: string, hasAttackBoost: boolean) =>
  buildSemanticTextTokens(text, hasAttackBoost).map((token) => {
    if (token.type === 'explicitMarkup') {
      return { type: token.type, rawContent: token.rawContent };
    }
    if (token.type === 'styledText') {
      return { type: token.type, text: token.text, className: token.className };
    }
    return { type: token.type, text: token.text };
  });

describe('buildSemanticTextTokens', () => {
  it('tokenizes plain text, inline classes, and both explicit marker forms before rendering', () => {
    expect(compactTokens('A$B$text-red-500#C{D}E《F》G', true)).toEqual([
      { type: 'text', text: 'A' },
      { type: 'styledText', text: 'B', className: 'text-red-500' },
      { type: 'text', text: 'C' },
      { type: 'explicitMarkup', rawContent: 'D' },
      { type: 'text', text: 'E' },
      { type: 'explicitMarkup', rawContent: 'F' },
      { type: 'text', text: 'G' },
    ]);
  });

  it.each(['{5}伤害', '{5*}点伤害', '{$5$text-red-500#}伤害', '{_20*}伤害'])(
    'assigns a rendered damage suffix to its semantic token for %s',
    (text) => {
      expect(compactTokens(text, true)).toEqual([
        { type: 'explicitMarkup', rawContent: expect.any(String) },
      ]);
    }
  );

  it('retains suffix text when the explicit marker does not render calculated damage', () => {
    expect(compactTokens('{5+2}伤害', true)).toEqual([
      { type: 'explicitMarkup', rawContent: '5+2' },
      { type: 'text', text: '伤害' },
    ]);
    expect(compactTokens('{5}伤害', false)).toEqual([
      { type: 'explicitMarkup', rawContent: '5' },
      { type: 'text', text: '伤害' },
    ]);
  });

  it('preserves malformed explicit markup as literal text', () => {
    expect(compactTokens('A{未闭合', true)).toEqual([{ type: 'text', text: 'A{未闭合' }]);
  });
});
