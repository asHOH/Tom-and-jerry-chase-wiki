import React, { type JSX } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import * as passwordUtils from '@/lib/passwordUtils';

import LoginDialog from './LoginDialog';

const mockConvertToPinyin = jest.fn(async (value: string) => value);

jest.mock('@/lib/passwordUtils', () => {
  const actual = jest.requireActual<typeof import('@/lib/passwordUtils')>('@/lib/passwordUtils');
  return { ...actual, checkPasswordStrength: jest.fn(actual.checkPasswordStrength) };
});

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
  default: ({ onVerify }: { onVerify: (token: string) => void }) => (
    <button type='button' onClick={() => onVerify('captcha-token')}>
      通过验证码
    </button>
  ),
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
  const originalFetch = global.fetch;
  const strongPassword = 'StrongPassword!2026';

  async function enterRegistration() {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'tester' } });
    fireEvent.click(screen.getByRole('button', { name: '通过验证码' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '继续' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    await screen.findByRole('heading', { name: '创建账户' });
  }

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'not_exists', captchaProof: 'captcha-proof' }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('keeps strength feedback separate from live confirmation errors', async () => {
    render(<LoginDialog open onClose={jest.fn()} isMobile={false} />);
    await enterRegistration();
    const password = screen.getByLabelText('密码');
    const confirmation = screen.getByLabelText('确认密码');
    fireEvent.change(password, { target: { value: strongPassword } });
    const meter = await screen.findByRole('meter', { name: '密码强度' });
    expect(meter).toHaveAttribute('aria-valuetext', '很强');
    expect(password).toHaveAccessibleDescription('密码强度很强');
    expect(confirmation).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('两次输入的密码不一致。')).not.toBeInTheDocument();

    fireEvent.change(confirmation, { target: { value: 'different' } });
    expect(confirmation).toBeInvalid();
    expect(confirmation).toHaveAccessibleDescription('两次输入的密码不一致。');
    expect(password).not.toHaveAttribute('aria-invalid');
    expect(password).toHaveAccessibleDescription('密码强度很强');
    expect(meter).toHaveAttribute('aria-valuetext', '很强');
    expect(screen.getByRole('button', { name: '继续' })).toBeDisabled();

    fireEvent.change(confirmation, { target: { value: '' } });
    expect(confirmation).not.toHaveAttribute('aria-invalid');
    expect(confirmation).not.toHaveAttribute('aria-describedby');
    fireEvent.change(confirmation, { target: { value: strongPassword } });
    expect(confirmation).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('button', { name: '继续' })).toBeEnabled();

    fireEvent.change(password, { target: { value: `${strongPassword}!` } });
    expect(confirmation).toBeInvalid();
    expect(confirmation).toHaveAccessibleDescription('两次输入的密码不一致。');
    await screen.findByRole('meter');
  });

  it('associates weak-password feedback with the password even when confirmation matches', async () => {
    render(<LoginDialog open onClose={jest.fn()} isMobile={false} />);
    await enterRegistration();
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: 'abc' } });
    expect(await screen.findByRole('meter')).toHaveAttribute('aria-valuetext', '弱');
    expect(screen.getByLabelText('密码')).toBeInvalid();
    expect(screen.getByLabelText('密码')).toHaveAccessibleDescription(
      '密码过短，至少需要 6 个字符'
    );
    expect(screen.getByLabelText('确认密码')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('button', { name: '继续' })).toBeDisabled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('clears required-field feedback as values are corrected and resets it on reopen', async () => {
    const view = render(<LoginDialog open onClose={jest.fn()} isMobile={false} />);
    await enterRegistration();
    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    expect(screen.getByLabelText('昵称')).toHaveAccessibleDescription('昵称不能为空。');
    expect(screen.getByLabelText('密码')).toHaveAccessibleDescription('密码不能为空。');
    expect(screen.getByLabelText('确认密码')).toHaveAccessibleDescription('请再次输入密码。');
    for (const label of ['昵称', '密码', '确认密码']) {
      expect(screen.getByLabelText(label)).toBeInvalid();
    }
    expect(global.fetch).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('昵称'), { target: { value: '昵称' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: strongPassword } });
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: strongPassword } });
    await screen.findByRole('meter');
    for (const label of ['昵称', '密码', '确认密码']) {
      expect(screen.getByLabelText(label)).not.toHaveAttribute('aria-invalid');
    }
    expect(screen.queryByText('昵称不能为空。')).not.toBeInTheDocument();
    expect(screen.queryByText('密码不能为空。')).not.toBeInTheDocument();
    expect(screen.queryByText('请再次输入密码。')).not.toBeInTheDocument();

    view.rerender(<LoginDialog open={false} onClose={jest.fn()} isMobile={false} />);
    view.rerender(<LoginDialog open onClose={jest.fn()} isMobile={false} />);
    await enterRegistration();
    for (const label of ['昵称', '密码', '确认密码']) {
      expect(screen.getByLabelText(label)).toHaveValue('');
      expect(screen.getByLabelText(label)).not.toHaveAttribute('aria-invalid');
    }
  });

  it('announces submission failures and clears them when registration values change', async () => {
    render(<LoginDialog open onClose={jest.fn()} isMobile={false} />);
    await enterRegistration();
    fireEvent.change(screen.getByLabelText('昵称'), { target: { value: '昵称' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: strongPassword } });
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: strongPassword } });
    await screen.findByRole('meter');
    let resolveRegistration!: () => void;
    jest.mocked(global.fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRegistration = () =>
            resolve({
              ok: false,
              json: async () => ({ error: '昵称已被占用。' }),
            } as Response);
        })
    );
    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    expect(global.fetch).toHaveBeenLastCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'tester',
        nickname: '昵称',
        password: strongPassword,
        captchaToken: 'captcha-proof',
      }),
    });
    expect(screen.getByRole('button', { name: '继续' })).toBeDisabled();
    await act(async () => {
      resolveRegistration();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('昵称已被占用。');
    expect(screen.getByRole('button', { name: '继续' })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('昵称'), { target: { value: '新昵称' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows pending strength for the current password and ignores a stale result', async () => {
    render(<LoginDialog open onClose={jest.fn()} isMobile={false} />);
    await enterRegistration();
    let resolveOldStrength!: (strength: passwordUtils.PasswordStrength) => void;
    jest.mocked(passwordUtils.checkPasswordStrength).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOldStrength = resolve;
        })
    );
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: strongPassword } });
    expect(screen.getByLabelText('密码')).toHaveAccessibleDescription('正在检查密码强度…');
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '继续' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'abc' } });
    expect(await screen.findByRole('meter')).toHaveAttribute('aria-valuetext', '弱');
    await act(async () => {
      resolveOldStrength({ strength: 4, reason: '密码强度很强' });
    });
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '弱');
    expect(screen.getByLabelText('密码')).toHaveAccessibleDescription(
      '密码过短，至少需要 6 个字符'
    );
  });

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
      'h-dvh',
      'w-full',
      'rounded-none'
    );
  });
});
