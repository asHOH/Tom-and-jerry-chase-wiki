'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { getUserData, userObject } from '@/hooks/useUser';

type LoginDialogProps = {
  onClose: () => void;
  isMobile: boolean;
};

type AuthStep = 'username' | 'password' | 'register';

const LoginDialog: React.FC<LoginDialogProps> = ({ onClose, isMobile }) => {
  const [step, setStep] = useState<AuthStep>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);

  const checkUsername = async () => {
    if (username.trim() === '') {
      setError('用户名不能为空。');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '发生错误。');
      }
      switch (data.status) {
        case 'exists_no_password':
          // Auto-login for passwordless users
          await handleLogin(true);
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

  const handleLogin = async (isPasswordless = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: isPasswordless ? undefined : password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '登录失败。');
      }
      // Assuming successful login returns a session, we close the dialog.
      // In a real app, you'd handle the session state.
      Object.assign(userObject, await getUserData());
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
        body: JSON.stringify({ username, nickname, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '注册失败。');
      }
      // After successful registration, log the user in.
      await handleLogin();
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
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>输入密码</h2>
            <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
              欢迎回来，<span className='font-semibold'>{username}</span>。
            </p>
            <input
              type='password'
              placeholder='密码'
              className='w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </>
        );
      case 'register':
        return (
          <>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>创建账户</h2>
            <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
              用户名 <span className='font-semibold'>{username}</span> 未被占用。
            </p>
            <input
              type='text'
              placeholder='昵称'
              className='w-full p-2 mb-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoFocus
            />
            <input
              type='password'
              placeholder={
                process.env.NEXT_PUBLIC_DISABLE_NOPASSWD_USER_AUTH ? '密码' : '密码（可选）'
              }
              className='w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        );
      case 'username':
      default:
        return (
          <>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-4'>登录或注册</h2>
            <input
              type='text'
              placeholder='输入您的用户名'
              className='w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </>
        );
    }
  };

  return (
    <motion.div
      className={clsx(
        'fixed inset-0 bg-gray-800/40 backdrop-blur-sm flex items-center justify-center z-50',
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
          'bg-white dark:bg-gray-800 shadow-xl p-6 relative',
          isMobile
            ? 'w-full h-full rounded-none flex flex-col'
            : 'rounded-lg w-full max-w-sm mx-auto'
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
          <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>{renderStep()}</div>

          {error && <p className='text-red-500 text-sm mb-4'>{error}</p>}

          <button
            type='submit'
            disabled={isLoading}
            className='w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center'
          >
            {isLoading ? (
              <svg
                className='animate-spin h-5 w-5 text-white'
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
