import { render } from '@testing-library/react';

import { BlockquoteIcon } from './RichTextEditorIcons';

describe('RichTextEditorIcons', () => {
  it('uses a unique mask for each blockquote icon instance', () => {
    const { container } = render(
      <>
        <BlockquoteIcon />
        <BlockquoteIcon />
      </>
    );

    const icons = Array.from(container.querySelectorAll('svg'));
    const maskIds = icons.map((icon) => icon.querySelector('mask')?.getAttribute('id'));

    expect(maskIds).toHaveLength(2);
    expect(maskIds.every(Boolean)).toBe(true);
    expect(new Set(maskIds).size).toBe(2);

    icons.forEach((icon, index) => {
      icon.querySelectorAll('rect[mask]').forEach((rect) => {
        expect(rect).toHaveAttribute('mask', `url(#${maskIds[index]})`);
      });
    });
  });
});
