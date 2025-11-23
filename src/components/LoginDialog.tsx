'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { motion } from 'motion/react';

import { checkPasswordStrength, PasswordStrength } from '@/lib/passwordUtils';
import { convertToPinyin } from '@/lib/pinyinUtils';
import { CloseIcon } from '@/components/icons/CommonIcons';

import CaptchaComponent from './CaptchaComponent';

type LoginDialogProps = {
  onClose: () => void;
  isMobile: boolean;
};

type AuthStep = 'username' | 'password' | 'register';

const LoginDialog: React.FC<LoginDialogProps> = ({ onClose, isMobile }) => {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [captchaProof, setCaptchaProof] = useState<string | null>(null);

  const [isUsernameCorrect, setIsUsernameCorrect] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    convertToPinyin(username).then((pinyin) => {
      setIsUsernameCorrect(
        pinyin != '' &&
          /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/.test(pinyin)
      );
    });
  }, [username]);

  // Check password strength when in register step
  useEffect(() => {
    if (step === 'register' && password) {
      checkPasswordStrength(password).then(setPasswordStrength);
    } else {
      setPasswordStrength(null);
    }
  }, [password, step]);

  const dialogRef = useRef<HTMLDivElement>(null);

  const checkUsername = async () => {
    if (token === null) {
      setError('请通过验证码。');
      return;
    }
    if (!isUsernameCorrect) {
      setError('用户名格式错误。');
      return;
    }
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
      if (data.captchaProof) {
        setCaptchaProof(data.captchaProof);
      }
      switch (data.status) {
        case 'exists_no_password':
          // Auto-login for passwordless users
          await handleLogin(true, data.captchaProof);
          break;
        case 'exists_with_password':
          setStep('password');
          break;
        case 'not_exists':
          setStep('register');
          break;
        default:
          setError('从服务器收到意外响应。');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (isPasswordless = false, proof: string | null = null) => {
    setIsLoading(true);
    setError(null);
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
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (nickname.trim() === '') {
      setError('昵称不能为空。');
      return;
    }
    if (password.trim() === '' && process.env.NEXT_PUBLIC_DISABLE_NOPASSWD_USER_AUTH) {
      setError('密码不能为空。');
      return;
    }
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
      await handleLogin(false, captchaProof);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误。');
    } finally {
      setIsLoading(false);
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
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
              type='password'
              placeholder='密码'
              className='w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white'
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
              type='text'
              placeholder='昵称'
              className='mb-2 w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white'
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoFocus
            />
            <input
              type='password'
              placeholder={
                process.env.NEXT_PUBLIC_DISABLE_NOPASSWD_USER_AUTH ? '密码' : '密码（可选）'
              }
              className='w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='new-password'
            />
            {password && passwordStrength && (
              <div className='mt-2'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
                    <div
                      className={clsx('h-full transition-all duration-300', {
                        'bg-red-500': passwordStrength.strength <= 1,
                        'bg-orange-500': passwordStrength.strength === 2,
                        'bg-green-500': passwordStrength.strength === 3,
                        'bg-emerald-600': passwordStrength.strength === 4,
                      })}
                      style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                    />
                  </div>
                  <span
                    className={clsx('text-xs font-medium', {
                      'text-red-500': passwordStrength.strength <= 1,
                      'text-orange-500': passwordStrength.strength === 2,
                      'text-green-500': passwordStrength.strength === 3,
                      'text-emerald-600': passwordStrength.strength === 4,
                    })}
                  >
                    {passwordStrength.strength === 0 && '无效'}
                    {passwordStrength.strength === 1 && '弱'}
                    {passwordStrength.strength === 2 && '一般'}
                    {passwordStrength.strength === 3 && '良好'}
                    {passwordStrength.strength === 4 && '很强'}
                  </span>
                </div>
                <p className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
                  {passwordStrength.reason}
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
            <input
              type='text'
              placeholder='用户名，支持汉字、拉丁字母、数字和._-+'
              className='w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white'
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
    <motion.div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center bg-gray-800/40 backdrop-blur-sm',
        isMobile && 'p-0'
      )}
      initial='hidden'
      animate='visible'
      exit='exit'
      variants={backdropVariants}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        ref={dialogRef}
        className={clsx(
          'relative bg-white p-6 shadow-xl dark:bg-gray-800',
          isMobile
            ? 'flex h-full w-full flex-col rounded-none'
            : 'mx-auto w-full max-w-sm rounded-lg'
        )}
        variants={dialogVariants}
        transition={{ duration: 0.2 }}
      >
        <button
          type='button'
          onClick={onClose}
          className='absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          aria-label='关闭对话框'
        >
          <CloseIcon className='h-6 w-6' />
        </button>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>{renderStep()}</div>

          {error && <p className='mb-4 text-sm text-red-500'>{error}</p>}

          <button
            type='submit'
            disabled={
              isLoading ||
              !isUsernameCorrect ||
              (step === 'register' &&
                !!password &&
                !!passwordStrength &&
                passwordStrength.strength <= 1)
            }
            className='flex w-full items-center justify-center rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400'
          >
            {isLoading ? (
              <svg
                className='h-5 w-5 animate-spin text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
            ) : (
              '继续'
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default LoginDialog;
