'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface NotificationTooltipProps {
  message: string;
  show: boolean;
  onHide: () => void;
  duration?: number;
  type?: 'success' | 'info' | 'warning' | 'error';
}

const NotificationTooltip: React.FC<NotificationTooltipProps> = ({
  message,
  show,
  onHide,
  duration = 4000,
  type = 'success',
}) => {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Use requestAnimationFrame to ensure element is rendered before animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });

      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for fade out animation to complete before hiding
        setTimeout(() => {
          setShouldRender(false);
          onHide();
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setTimeout(() => setShouldRender(false), 300);
    }

    // Return empty cleanup function if not showing
    return () => {};
  }, [show, duration, onHide]);

  if (!mounted || !shouldRender) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600';
      case 'info':
        return 'bg-blue-600';
      case 'warning':
        return 'bg-yellow-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-green-600';
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
            className='w-4 h-4'
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
            className='w-4 h-4'
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
            className='w-4 h-4'
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
            className='w-4 h-4'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return createPortal(
    <div
      className={`fixed bottom-4 right-4 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ease-out ${getTypeStyles()} ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
      style={{ position: 'fixed' }}
    >
      <div className='flex items-center space-x-2'>
        {getIcon()}
        <span>{message}</span>
      </div>
    </div>,
    document.body
  );
};

export default NotificationTooltip;
