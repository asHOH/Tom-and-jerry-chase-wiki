import React, { type JSX } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ArticleCharacterSelector, CharacterSlotsSelector } from './CharacterSelector';

jest.mock('motion/react', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const motionOnlyProps = new Set(['animate', 'exit', 'initial', 'transition']);

  const MockMotionDiv = ReactModule.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ children, ...props }, ref) => {
    const htmlProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !motionOnlyProps.has(key))
    ) as React.HTMLAttributes<HTMLDivElement>;

    return ReactModule.createElement('div', { ...htmlProps, ref }, children);
  });
  MockMotionDiv.displayName = 'MockMotion(div)';

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    m: { div: MockMotionDiv },
    useReducedMotion: () => false,
  } satisfies {
    AnimatePresence: (props: { children: React.ReactNode }) => JSX.Element;
    m: { div: typeof MockMotionDiv };
    useReducedMotion: () => boolean;
  };
});

describe('ArticleCharacterSelector', () => {
  it('offers characters from the published route projection', () => {
    const onSelect = jest.fn();

    render(
      <ArticleCharacterSelector
        characters={[{ id: '__published_article_character__', factionId: 'mouse' }]}
        selectedCharacterId={null}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '选择角色' }));
    fireEvent.click(screen.getByRole('button', { name: /__published_article_character__/ }));

    expect(onSelect).toHaveBeenCalledWith('__published_article_character__');
  });
});

describe('CharacterSlotsSelector', () => {
  it('ignores Escape but closes from its backdrop', async () => {
    const { container } = render(
      <CharacterSlotsSelector
        title='选择测试角色'
        characters={[{ id: '汤姆' }]}
        selectedIds={[null]}
        onSelectedIdsChange={jest.fn()}
        getCharacterImageUrl={() => '/images/test.png'}
      />
    );

    const emptySlot = container.querySelector<HTMLElement>('.h-24.w-24');
    expect(emptySlot).not.toBeNull();
    fireEvent.click(emptySlot!);

    expect(screen.getByRole('dialog', { name: '选择测试角色' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: '选择测试角色' })).toBeInTheDocument();

    const backdrop = document.body.querySelector<HTMLElement>('.fixed.inset-0[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop!);
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '选择测试角色' })).not.toBeInTheDocument();
    });
  });
});
