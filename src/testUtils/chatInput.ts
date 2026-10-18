import { act, fireEvent } from '@testing-library/react';

// JSDOM omits the text-range geometry used to scroll the editor's caret.
beforeAll(() => {
  Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [] });
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => new DOMRect(),
  });
});

/** Replace a draft using the editor's normal select-all and plain-text paste interaction. */
export function replaceChatInputText(input: HTMLElement, text: string) {
  act(() => input.focus());
  fireEvent.keyDown(input, { key: 'a', code: 'KeyA', keyCode: 65, ctrlKey: true });
  fireEvent.paste(input, { clipboardData: { getData: () => text } });
}
