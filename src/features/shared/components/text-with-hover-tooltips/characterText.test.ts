import { preprocessText, wrapAutoNamesInText } from './characterText';

describe('wrapAutoNamesInText', () => {
  it('prefers higher-priority overlapping names over earlier lower-priority matches', () => {
    expect(wrapAutoNamesInText('ABC', ['BC', 'AB'], new Set())).toBe('A{BC}');
  });

  it('uses the longest matching name at the same position', () => {
    expect(wrapAutoNamesInText('剑客泰菲冲刺', ['剑客泰菲', '泰菲'], new Set())).toBe(
      '{剑客泰菲}冲刺'
    );
  });

  it('lets current character names block overlapping auto-wrap matches', () => {
    expect(wrapAutoNamesInText('侦探汤姆登场', ['侦探汤姆', '汤姆'], new Set(['侦探汤姆']))).toBe(
      '侦探汤姆登场'
    );
  });
});

describe('preprocessText', () => {
  it('wraps known non-current character names', () => {
    expect(preprocessText('布奇登场', '汤姆')).toBe('{布奇}登场');
  });

  it('does not wrap the current character name', () => {
    expect(preprocessText('汤姆登场', '汤姆')).toBe('汤姆登场');
  });

  it('leaves already marked up text unchanged', () => {
    expect(preprocessText('布奇{隐身}', '汤姆')).toBe('布奇{隐身}');
    expect(preprocessText('布奇《主动技能》', '汤姆')).toBe('布奇《主动技能》');
  });
});
