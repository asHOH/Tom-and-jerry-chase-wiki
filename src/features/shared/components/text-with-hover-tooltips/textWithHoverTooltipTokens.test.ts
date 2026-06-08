import { buildTextWithHoverTooltipTokens } from './textWithHoverTooltipTokens';

describe('buildTextWithHoverTooltipTokens', () => {
  it('builds plain, markdown, and bracket-tooltip tokens without React elements', () => {
    const parsed = buildTextWithHoverTooltipTokens('A**B**[C](D)E', undefined);

    expect(parsed.tokens).toEqual([
      { type: 'text', text: 'A' },
      { type: 'markdownHighlight', text: 'B' },
      {
        type: 'hoverTooltip',
        visibleText: 'C',
        tooltipContent: 'D',
        isQuoted: false,
        sourceIndex: 2,
        matchIndex: 0,
      },
      { type: 'text', text: 'E' },
    ]);
  });

  it('keeps bracket tooltips inside markdown highlights as highlight text', () => {
    const parsed = buildTextWithHoverTooltipTokens('**[C](D)**', undefined);

    expect(parsed.tokens).toEqual([{ type: 'markdownHighlight', text: '[C](D)' }]);
  });
});
