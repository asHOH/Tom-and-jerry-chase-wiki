import { render } from '@testing-library/react';

import TextWithHoverTooltips from './TextWithHoverTooltips';
import { replaceBuffIds } from './replaceBuffIds';
import { preprocessText } from './text-with-hover-tooltips/characterText';
import { renderColorfulHighlight } from './text-with-hover-tooltips/inlineMarkup';
import { renderTextWithTooltips } from './text-with-hover-tooltips/renderTextWithTooltips';

jest.mock('valtio', () => ({
  proxy: (value: unknown) => value,
  useSnapshot: (value: unknown) => value,
}));

jest.mock('@/context/DarkModeContext', () => ({
  useDarkMode: () => [false, jest.fn()] as const,
}));

jest.mock('@/hooks/useLocalEditEntity', () => ({
  useLocalCharacter: () => ({ characterId: '汤姆' }),
}));

jest.mock('@/data', () => ({
  characters: {
    汤姆: {
      attackBoost: 0,
      wallCrackDamageBoost: 0,
    },
  },
}));

jest.mock('@/lib/textUtils', () => ({
  renderTextWithHighlights: jest.fn((text: string) => [text]),
}));

jest.mock('./replaceBuffIds', () => ({
  replaceBuffIds: jest.fn((text: string) => text),
}));

jest.mock('./text-with-hover-tooltips/characterText', () => ({
  preprocessText: jest.fn((text: string) => text),
}));

jest.mock('./text-with-hover-tooltips/renderTextWithTooltips', () => ({
  renderTextWithTooltips: jest.fn((text: string) => [text]),
}));

jest.mock('./text-with-hover-tooltips/inlineMarkup', () => ({
  renderColorfulHighlight: jest.fn((text: string) => [text]),
}));

describe('TextWithHoverTooltips memoization', () => {
  it('reuses parsed output when render inputs do not change', () => {
    const { rerender } = render(<TextWithHoverTooltips text='plain text' />);

    rerender(<TextWithHoverTooltips text='plain text' />);

    expect(replaceBuffIds).toHaveBeenCalledTimes(1);
    expect(preprocessText).toHaveBeenCalledTimes(1);
    expect(renderTextWithTooltips).toHaveBeenCalledTimes(1);
    expect(renderColorfulHighlight).toHaveBeenCalledTimes(1);
  });
});
