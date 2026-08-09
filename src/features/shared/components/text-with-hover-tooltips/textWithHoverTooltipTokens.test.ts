import {
  buildTextWithHoverTooltipTokens,
  claimHighlightedDamageSuffixes,
} from './textWithHoverTooltipTokens';

describe('buildTextWithHoverTooltipTokens', () => {
  it('builds plain, markdown, and bracket-tooltip tokens without React elements', () => {
    const parsed = buildTextWithHoverTooltipTokens('A**B**[C](D)E', undefined);

    expect(parsed.tokens).toEqual([
      { type: 'text', text: 'A', isHighlighted: false },
      { type: 'text', text: 'B', isHighlighted: true },
      {
        type: 'hoverTooltip',
        visibleText: 'C',
        tooltipContent: 'D',
        isQuoted: false,
        sourceIndex: 2,
        matchIndex: 0,
        isHighlighted: false,
      },
      { type: 'text', text: 'E', isHighlighted: false },
    ]);
  });

  it('preserves highlight decoration on bracket tooltips', () => {
    const parsed = buildTextWithHoverTooltipTokens('**[C](D)**', undefined);

    expect(parsed.tokens).toEqual([
      {
        type: 'hoverTooltip',
        visibleText: 'C',
        tooltipContent: 'D',
        isQuoted: false,
        sourceIndex: 0,
        matchIndex: 0,
        isHighlighted: true,
      },
    ]);
  });

  it('moves an external damage suffix into its highlighted semantic token', () => {
    const parsed = buildTextWithHoverTooltipTokens('**{5*,无来源}**伤害', undefined);

    expect(claimHighlightedDamageSuffixes(parsed.tokens, true)).toEqual([
      { type: 'text', text: '{5*,无来源}伤害', isHighlighted: true },
      { type: 'text', text: '', isHighlighted: false },
    ]);
  });

  it('does not claim suffixes for expressions that do not render calculated damage', () => {
    const parsed = buildTextWithHoverTooltipTokens('**{5+2}**伤害', undefined);

    expect(claimHighlightedDamageSuffixes(parsed.tokens, true)).toEqual(parsed.tokens);
  });

  it('applies automatic links after splitting highlights and bracket tooltips', () => {
    const parsed = buildTextWithHoverTooltipTokens('**布奇**[布奇](布奇)', '汤姆');

    expect(parsed.tokens).toEqual([
      { type: 'text', text: '{布奇}', isHighlighted: true },
      {
        type: 'hoverTooltip',
        visibleText: '{布奇}',
        tooltipContent: '{布奇}',
        isQuoted: false,
        sourceIndex: 1,
        matchIndex: 0,
        isHighlighted: false,
      },
    ]);
  });
});
