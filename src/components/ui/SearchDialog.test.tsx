import React, { type JSX } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import SearchDialog from './SearchDialog';

jest.mock('@/lib/searchUtils', () => ({
  performSearch: async function* () {},
}));

jest.mock('@/hooks/useChat', () => ({
  useChat: () => ({
    responseText: null,
    isLoading: false,
  }),
}));

jest.mock('@/hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({
    handleSelectCard: jest.fn(),
    handleSelectCharacter: jest.fn(),
  }),
}));

jest.mock('@/context/DarkModeContext', () => ({
  useDarkMode: () => [false],
}));

jest.mock('motion/react', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const motionOnlyProps = new Set(['animate', 'exit', 'initial', 'transition', 'variants']);

  const createMotionTag = (tag: 'div' | 'li' | 'ul') => {
    const MotionTag = ReactModule.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
      ({ children, ...props }, ref) => {
        const htmlProps = Object.fromEntries(
          Object.entries(props).filter(([key]) => !motionOnlyProps.has(key))
        ) as React.HTMLAttributes<HTMLElement>;

        return ReactModule.createElement(tag, { ...htmlProps, ref }, children);
      }
    );
    MotionTag.displayName = `MockMotion(${tag})`;
    return MotionTag;
  };

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    m: {
      div: createMotionTag('div'),
      li: createMotionTag('li'),
      ul: createMotionTag('ul'),
    },
    useReducedMotion: () => false,
  } satisfies {
    AnimatePresence: (props: { children: React.ReactNode }) => JSX.Element;
    m: {
      div: ReturnType<typeof createMotionTag>;
      li: ReturnType<typeof createMotionTag>;
      ul: ReturnType<typeof createMotionTag>;
    };
    useReducedMotion: () => boolean;
  };
});

describe('SearchDialog', () => {
  it('uses controlled dismissal and clears the query before reopening', () => {
    const onClose = jest.fn();
    const { rerender } = render(<SearchDialog open onClose={onClose} isMobile={false} />);

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: '汤姆' } });
    expect(searchInput).toHaveValue('汤姆');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<SearchDialog open={false} onClose={onClose} isMobile={false} />);
    expect(screen.queryByRole('dialog', { name: '搜索' })).not.toBeInTheDocument();

    rerender(<SearchDialog open onClose={onClose} isMobile />);
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.getByRole('dialog', { name: '搜索' })).toHaveClass(
      'inset-0',
      'h-full',
      'w-full',
      'rounded-none'
    );
  });
});
