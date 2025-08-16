'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

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

  // Mock API call to check username
  const checkUsername = async () => {
    setIsLoading(true);
    setError(null);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock responses based on username
    if (username === 'user_no_pass') {
      setStep('username'); // Should be auto-login, but for now, just reset
      onClose(); // Simulate successful login
    } else if (username === 'user_with_pass') {
      setStep('password');
    } else if (username.trim() === '') {
      setError('Username cannot be empty.');
    } else {
      setStep('register');
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (password === 'password') {
      onClose(); // Simulate successful login
    } else {
      setError('Incorrect password.');
    }
    setIsLoading(false);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (nickname.trim() === '') {
      setError('Nickname cannot be empty.');
    } else {
      onClose(); // Simulate successful registration
    }
    setIsLoading(false);
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
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>Enter Password</h2>
            <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
              Welcome back, <span className='font-semibold'>{username}</span>.
            </p>
            <input
              type='password'
              placeholder='Password'
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
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>Create Account</h2>
            <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
              Username <span className='font-semibold'>{username}</span> is not taken.
            </p>
            <input
              type='text'
              placeholder='Nickname'
              className='w-full p-2 mb-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoFocus
            />
            <input
              type='password'
              placeholder='Password (optional)'
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
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-4'>
              Login or Register
            </h2>
            <input
              type='text'
              placeholder='Enter your username'
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
          aria-label='Close dialog'
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
              'Continue'
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default LoginDialog;
