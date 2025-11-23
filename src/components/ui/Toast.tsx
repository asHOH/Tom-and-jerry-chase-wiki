import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number | undefined;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'success',
  duration = 4000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    // Auto close
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for animation to finish before removing
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 dark:bg-green-700';
      case 'info':
        return 'bg-blue-600 dark:bg-blue-700';
      case 'warning':
        return 'bg-yellow-600 dark:bg-yellow-700';
      case 'error':
        return 'bg-red-600 dark:bg-red-700';
      default:
        return 'bg-green-600 dark:bg-green-700';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-5 w-5'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        );
      case 'info':
        return (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-5 w-5'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-5 w-5'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-5 w-5'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={clsx(
        'pointer-events-auto mb-2 flex w-full max-w-sm items-center space-x-3 rounded-lg px-4 py-3 text-white shadow-lg transition-all duration-300 ease-out',
        getTypeStyles(),
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
      role='alert'
    >
      <div className='flex-shrink-0'>{getIcon()}</div>
      <div className='flex-1 text-sm font-medium'>{message}</div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(id), 300);
        }}
        className='ml-2 inline-flex flex-shrink-0 rounded-md p-1.5 text-white/80 hover:bg-black/10 hover:text-white focus:ring-2 focus:ring-white focus:outline-none'
      >
        <span className='sr-only'>Close</span>
        <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M6 18L18 6M6 6l12 12'
          />
        </svg>
      </button>
    </div>
  );
};
