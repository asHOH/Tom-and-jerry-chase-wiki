import React, { type JSX } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import AdvancedCardGroupEditor from './AdvancedCardGroupEditor';

jest.mock('@/hooks/useMediaQuery', () => ({
  useMobile: () => false,
}));

jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <span aria-label={alt} />,
}));

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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

describe('AdvancedCardGroupEditor', () => {
  it('lets the nested picker own Escape before the outer editor', () => {
    const onClose = jest.fn();

    render(
      <AdvancedCardGroupEditor
        isOpen
        initialCards={[]}
        factionId='cat'
        getCardCost={() => 0}
        imageBasePath='/images/catCards/'
        onClose={onClose}
        onSave={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /添加知识卡/ }));

    expect(screen.queryByRole('dialog', { name: '高级编辑知识卡组' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '选择知识卡' })).toBeInTheDocument();
    expect(document.body).toHaveStyle({ overflow: 'hidden' });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: '选择知识卡' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '高级编辑知识卡组' })).toBeInTheDocument();
    expect(document.body).toHaveStyle({ overflow: 'hidden' });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
