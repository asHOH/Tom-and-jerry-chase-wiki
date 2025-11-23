'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to performance monitoring if available
    if (typeof window !== 'undefined' && window.performance) {
      const errorLog = {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      };

      const errors = JSON.parse(localStorage.getItem('errorBoundaryErrors') || '[]');
      errors.push(errorLog);

      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }

      localStorage.setItem('errorBoundaryErrors', JSON.stringify(errors));
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorDisplay error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

/**
 * Error display component with retry functionality
 */
export function ErrorDisplay({
  error,
  onRetry,
  title = '加载失败',
  className = '',
}: {
  error?: Error | undefined;
  onRetry?: () => void;
  title?: string;
  className?: string;
}) {
  const isNetworkError = error?.message.includes('fetch') || error?.message.includes('network');
  const isTimeoutError = error?.message.includes('timeout');

  let errorMessage = '数据加载时出现问题，请稍后重试。';
  let suggestion = '';

  if (isNetworkError) {
    errorMessage = '网络连接出现问题。';
    suggestion = '请检查网络连接，然后点击重试。';
  } else if (isTimeoutError) {
    errorMessage = '加载超时，请重试。';
    suggestion = '服务器响应较慢，请稍后重试。';
  }

  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <div className='max-w-md space-y-4'>
        {/* Error icon */}
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20'>
          <svg
            className='h-8 w-8 text-red-600 dark:text-red-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
        </div>

        {/* Error message */}
        <div className='space-y-2'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>{title}</h3>
          <p className='text-gray-600 dark:text-gray-400'>{errorMessage}</p>
          {suggestion && <p className='text-sm text-gray-500 dark:text-gray-500'>{suggestion}</p>}
        </div>

        {/* Actions */}
        <div className='flex flex-col justify-center gap-3 sm:flex-row'>
          {onRetry && (
            <button
              onClick={onRetry}
              className='rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
            >
              重试
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className='rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none'
          >
            刷新页面
          </button>
        </div>

        {/* Debug info (development only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className='mt-4 text-left'>
            <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
              错误详情 (开发模式)
            </summary>
            <pre className='mt-2 overflow-auto rounded bg-gray-100 p-3 text-xs dark:bg-gray-800'>
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for handling loading states with error boundaries
 */
export function useLoadingState() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = React.useCallback((error: Error) => {
    setIsLoading(false);
    setError(error);
  }, []);

  const retry = React.useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    retry,
  };
}
