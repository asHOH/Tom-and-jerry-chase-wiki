'use client';

import { Toaster } from 'sonner';

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@/components/icons/CommonIcons';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

const baseToastClass =
  'pointer-events-auto flex w-full max-w-sm cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg';
const iconClass = 'h-5 w-5 text-white';

const icons = {
  success: <CheckCircleIcon className={iconClass} strokeWidth={1.5} />,
  info: <InformationCircleIcon className={iconClass} />,
  warning: <ExclamationTriangleIcon className={iconClass} />,
  error: <XCircleIcon className={iconClass} />,
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
      className='pointer-events-none z-100'
      toastOptions={{
        unstyled: true,
        closeButton: false,
        classNames: {
          toast: baseToastClass,
          title: 'text-white',
          description: 'text-white',
          content: 'flex-1',
          icon: iconClass,
          actionButton:
            'shrink-0 rounded-md bg-white/20 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
          success: 'bg-green-700 dark:bg-green-800',
          info: 'bg-blue-600 dark:bg-blue-700',
          warning: 'bg-amber-700 dark:bg-amber-800',
          error: 'bg-red-600 dark:bg-red-700',
        },
      }}
    />
  );
}
