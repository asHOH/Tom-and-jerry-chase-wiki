import React, { type JSX } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import LoginDialog from './LoginDialog';

const mockConvertToPinyin = jest.fn(async (value: string) => value);

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock('@/lib/pinyinUtils', () => ({
  convertToPinyin: (value: string) => mockConvertToPinyin(value),
}));

jest.mock('./CaptchaComponent', () => ({
  __esModule: true,
  default: () => <div>验证码</div>,
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

describe('LoginDialog', () => {
  it('uses controlled dismissal and clears state before reopening', async () => {
    const onClose = jest.fn();
    const { rerender } = render(<LoginDialog open onClose={onClose} isMobile={false} />);

    const usernameInput = screen.getByRole('textbox');
    fireEvent.change(usernameInput, { target: { value: 'tester' } });
    await waitFor(() => {
      expect(mockConvertToPinyin).toHaveBeenCalledWith('tester');
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<LoginDialog open={false} onClose={onClose} isMobile={false} />);
    expect(screen.queryByRole('dialog', { name: '登录或注册' })).not.toBeInTheDocument();

    rerender(<LoginDialog open onClose={onClose} isMobile />);
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.getByRole('dialog', { name: '登录或注册' })).toHaveClass(
      'inset-0',
      'h-full',
      'w-full',
      'rounded-none'
    );
  });
});
