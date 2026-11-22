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

  it('tokenizes written-out number+unit quantities', () => {
    expect(compactTokens('移速790单位长/s，范围300单位长，高度10。', true)).toEqual([
      { type: 'text', text: '移速' },
      { type: 'unitQuantity', text: '790单位长/s' },
      { type: 'text', text: '，范围' },
      { type: 'unitQuantity', text: '300单位长' },
      { type: 'text', text: '，高度10。' },
    ]);
  });

  it('keeps accepting legacy unit spellings', () => {
    expect(compactTokens('10单位长度/秒和20单位距离', true)).toEqual([
      { type: 'unitQuantity', text: '10单位长度/秒' },
      { type: 'text', text: '和' },
      { type: 'unitQuantity', text: '20单位距离' },
    ]);
  });

  it('tokenizes bare per-second rates', () => {
    expect(compactTokens('以100/s的速度飞行，上限2000/s', true)).toEqual([
      { type: 'text', text: '以' },
      { type: 'unitQuantity', text: '100/s' },
      { type: 'text', text: '的速度飞行，上限' },
      { type: 'unitQuantity', text: '2000/s' },
    ]);
  });

  it('accepts 单位 without a length suffix in per-second rates', () => {
    expect(compactTokens('移速100单位/s', true)).toEqual([
      { type: 'text', text: '移速' },
      { type: 'unitQuantity', text: '100单位/s' },
    ]);
  });

  it('does not tokenize accelerations or low-value resource rates', () => {
    expect(compactTokens('重力加速度1000/秒²，Hp恢复速度提升1.5/秒，倒计时1/秒', true)).toEqual([
      { type: 'text', text: '重力加速度1000/秒²，Hp恢复速度提升1.5/秒，倒计时1/秒' },
    ]);
  });

  it('keeps plain length quantities that are followed by a number', () => {
    expect(compactTokens('范围300单位长 2秒后', true)).toEqual([
      { type: 'text', text: '范围' },
      { type: 'unitQuantity', text: '300单位长' },
      { type: 'text', text: ' 2秒后' },
    ]);
  });

  it('does not tokenize quantities inside explicit markup or inline-class spans', () => {
    expect(compactTokens('{$790单位长$text-red-500#}{10单位长}', true)).toEqual([
      { type: 'explicitMarkup', rawContent: '$790单位长$text-red-500#' },
      { type: 'explicitMarkup', rawContent: '10单位长' },
    ]);
    expect(compactTokens('$790单位长$text-red-500#', true)).toEqual([
      { type: 'styledText', text: '790单位长', className: 'text-red-500' },
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
