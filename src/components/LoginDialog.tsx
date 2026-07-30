'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useSWRConfig } from 'swr';

import { cn } from '@/lib/design';
import { checkPasswordStrength, PasswordStrength } from '@/lib/passwordUtils';
import { convertToPinyin } from '@/lib/pinyinUtils';
import { USER_API_KEY } from '@/hooks/useUser';
import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormControls';
import { CloseIcon } from '@/components/icons/CommonIcons';

import CaptchaComponent from './CaptchaComponent';

type LoginDialogProps = {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
};

type AuthStep = 'username' | 'password' | 'register';

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onClose, isMobile }) => {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const shouldReduceMotion = useReducedMotion();
  const dialogSessionRef = useRef(0);
  const [step, setStep] = useState<AuthStep>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [captchaProof, setCaptchaProof] = useState<string | null>(null);

  const [isUsernameCorrect, setIsUsernameCorrect] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (open) return;

    dialogSessionRef.current += 1;
    setStep('username');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setNickname('');
    setIsLoading(false);
    setError(null);
    setToken(null);
    setCaptchaProof(null);
    setIsUsernameCorrect(false);
    setPasswordStrength(null);
  }, [open]);

  useEffect(() => {
    const session = dialogSessionRef.current;
    let cancelled = false;

    convertToPinyin(username).then((pinyin) => {
      if (cancelled || !open || session !== dialogSessionRef.current) return;

      setIsUsernameCorrect(
        pinyin != '' &&
          /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/.test(pinyin)
      );
    });

    return () => {
      cancelled = true;
    };
  }, [open, username]);

  // Check password strength when in register step
  useEffect(() => {
    if (!open || step !== 'register' || !password) {
      setPasswordStrength(null);
      return;
    }

    const session = dialogSessionRef.current;
    let cancelled = false;

    checkPasswordStrength(password).then((strength) => {
      if (!cancelled && session === dialogSessionRef.current) {
        setPasswordStrength(strength);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, password, step]);

  const checkUsername = async () => {
    if (token === null) {
      setError('请通过验证码。');
      return;
    }
    if (!isUsernameCorrect) {
      setError('用户名格式错误。');
      return;
    }
    const session = dialogSessionRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, token }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '发生错误。');
      }
      if (session !== dialogSessionRef.current) return;

      if (data.captchaProof) {
        setCaptchaProof(data.captchaProof);
      }
      switch (data.status) {
        case 'exists_with_password':
          setStep('password');
          break;
        case 'requires_password_reset':
          setError('该账户需重置密码，请联系管理员。');
          break;
        case 'not_exists':
          setStep('register');
          break;
        case 'unavailable':
          setError('该用户名不可用，请更改。');
          break;
        default:
          setError('从服务器收到意外响应。');
      }
    } catch (err) {
      if (session === dialogSessionRef.current) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
    } finally {
      if (session === dialogSessionRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleLogin = async (
    isPasswordless = false,
    proof: string | null = null,
    session = dialogSessionRef.current
  ) => {
    if (session === dialogSessionRef.current) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: isPasswordless ? undefined : password,
          captchaToken: proof || captchaProof,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '登录失败。');
      }
      // Server-side login sets HttpOnly cookies; refresh to reflect session client-side
      router.refresh();
      await mutate(USER_API_KEY);
      onClose();
    } catch (err) {
      if (session === dialogSessionRef.current) {
        setError(err instanceof Error ? err.message : '发生未知错误。');
      }
    } finally {
      if (session === dialogSessionRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleRegister = async () => {
    if (nickname.trim() === '') {
      setError('昵称不能为空。');
      return;
    }
    if (password.trim() === '') {
      setError('密码不能为空。');
      return;
    }
    if (confirmPassword.trim() === '') {
      setError('请再次输入密码。');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }
    const session = dialogSessionRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, nickname, password, captchaToken: captchaProof }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '注册失败。');
      }
      // After successful registration, log the user in.
      await handleLogin(false, captchaProof, session);
    } catch (err) {
      if (session === dialogSessionRef.current) {
        setError(err instanceof Error ? err.message : '发生未知错误。');
      }
    } finally {
      if (session === dialogSessionRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'username') {
      checkUsername();
    } else if (step === 'password') {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'password':
        return (
          <>
            <h2 className='mb-2 text-xl font-bold text-gray-900 dark:text-white'>输入密码</h2>
            <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
              欢迎回来，<span className='font-semibold'>{username}</span>。
            </p>
            <input
              type='text'
              name='username'
              autoComplete='username'
              value={username}
              className='hidden'
              tabIndex={-1}
              aria-hidden='true'
              readOnly
            />
            <FormInput
              type='password'
              placeholder='密码'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete='current-password'
            />
          </>
        );
      case 'register':
        return (
          <>
            <h2 className='mb-2 text-xl font-bold text-gray-900 dark:text-white'>创建账户</h2>
            <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
              用户名 <span className='font-semibold'>{username}</span> 未被占用。
            </p>
            <input
              type='hidden'
              name='username'
              autoComplete='username'
              value={username}
              className='hidden'
              tabIndex={-1}
              aria-hidden='true'
              readOnly
            />
            <FormInput
              type='text'
              placeholder='昵称'
              className='mb-2'
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoFocus
            />
            <FormInput
              type='password'
              placeholder='密码'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='new-password'
            />
            <FormInput
              type='password'
              placeholder='确认密码'
              className='mt-2'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete='new-password'
            />
            {password && passwordStrength && (
              <div className='mt-2'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        password != confirmPassword
                          ? 'bg-red-500'
                          : {
                              'bg-red-500': passwordStrength.strength <= 1,
                              'bg-orange-500': passwordStrength.strength === 2,
                              'bg-green-500': passwordStrength.strength === 3,
                              'bg-emerald-600': passwordStrength.strength === 4,
                            }
                      )}
                      style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      password != confirmPassword
                        ? 'text-red-500'
                        : {
                            'text-red-500': passwordStrength.strength <= 1,
                            'text-orange-500': passwordStrength.strength === 2,
                            'text-green-500': passwordStrength.strength === 3,
                            'text-emerald-600': passwordStrength.strength === 4,
                          }
                    )}
                  >
                    {passwordStrength.strength === 0 && '无效'}
                    {passwordStrength.strength === 1 && '弱'}
                    {passwordStrength.strength === 2 && '一般'}
                    {passwordStrength.strength === 3 && '良好'}
                    {passwordStrength.strength === 4 && '很强'}
                  </span>
                </div>
                <p className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
                  {password != confirmPassword ? '两次输入的密码不一致' : passwordStrength.reason}
                </p>
              </div>
            )}
          </>
        );
      case 'username':
      default:
        return (
          <>
            <h2 className='mb-4 text-xl font-bold text-gray-900 dark:text-white'>登录或注册</h2>
            <FormInput
              type='text'
              placeholder='用户名，支持汉字、拉丁字母、数字和._-+'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <div className='my-3'>
              <CaptchaComponent
                onVerify={function (token) {
                  setToken(token);
                }}
              />
            </div>
          </>
        );
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      ariaLabel='登录或注册'
      lockScroll={false}
      panelClassName={cn(
        'p-6',
        isMobile
          ? 'inset-0 flex h-full w-full flex-col overflow-y-auto rounded-none'
          : 'inset-auto top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2'
      )}
    >
      <Button
        variant='unstyled'
        type='button'
        onClick={onClose}
        className='absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        aria-label='关闭对话框'
      >
        <CloseIcon className='h-6 w-6' />
      </Button>

      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <AnimatePresence mode='wait' initial={false}>
            <m.div
              key={step}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {renderStep()}
            </m.div>
          </AnimatePresence>
        </div>

        {error && <p className='mb-4 text-sm text-red-500'>{error}</p>}

        <Button
          type='submit'
          fullWidth
          variant='primary'
          size='md'
          loading={isLoading}
          disabled={
            isLoading ||
            !isUsernameCorrect ||
            (step === 'register' &&
              ((!!password && !!passwordStrength && passwordStrength.strength <= 1) ||
                (!!password && !!confirmPassword && password !== confirmPassword)))
          }
        >
          继续
        </Button>
      </form>
    </BaseDialog>
  );
};

export default LoginDialog;
