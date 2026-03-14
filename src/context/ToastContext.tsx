'use client';

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { toast } from 'sonner';

import { ToastType, ToastViewport } from '@/components/ui/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  successWithAction: (
    message: string,
    actionLabel: string,
    onClick: () => void,
    duration?: number
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const options = { duration, dismissible: true, closeButton: false };

    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'info':
        toast.info(message, options);
        break;
      case 'warning':
        toast.warning(message, options);
        break;
      default:
        toast(message, options);
    }
  }, []);

  const success = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration),
    [showToast]
  );
  const error = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration),
    [showToast]
  );
  const info = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration),
    [showToast]
  );
  const warning = useCallback(
    (message: string, duration?: number) => showToast(message, 'warning', duration),
    [showToast]
  );
  const successWithAction = useCallback(
    (message: string, actionLabel: string, onClick: () => void, duration = 6000) => {
      toast.success(message, {
        duration,
        dismissible: true,
        closeButton: false,
        action: { label: actionLabel, onClick },
      });
    },
    []
  );

  const contextValue = useMemo(
    () => ({ showToast, success, error, info, warning, successWithAction }),
    [error, info, showToast, success, warning, successWithAction]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
