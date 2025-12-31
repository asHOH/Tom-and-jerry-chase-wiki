'use client';

import { Toaster } from 'sonner';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

const baseToastClass =
  'pointer-events-auto flex w-full max-w-sm cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg';
const iconClass = 'h-5 w-5 text-white';

const icons = {
  success: (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
      className={iconClass}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </svg>
  ),
  info: (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
      className={iconClass}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'
      />
    </svg>
  ),
  warning: (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
      className={iconClass}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
      />
    </svg>
  ),
  error: (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
      className={iconClass}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </svg>
  ),
};

export function ToastViewport() {
  return (
    <Toaster
      position='bottom-right'
      closeButton={false}
      duration={4000}
      gap={8}
      offset='16px'
      richColors={false}
      icons={icons}
      className='pointer-events-none z-[100]'
      toastOptions={{
        unstyled: true,
        closeButton: false,
        classNames: {
          toast: baseToastClass,
          title: 'text-white',
          description: 'text-white/90',
          content: 'flex-1',
          icon: iconClass,
          success: 'bg-green-600 dark:bg-green-700',
          info: 'bg-blue-600 dark:bg-blue-700',
          warning: 'bg-yellow-600 dark:bg-yellow-700',
          error: 'bg-red-600 dark:bg-red-700',
        },
      }}
    />
  );
}
