'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

import { cn } from '@/lib/design';
import { storage, StorageKey } from '@/lib/localStorage';
import Button from '@/components/ui/Button';
import { ExclamationTriangleIcon } from '@/components/icons/CommonIcons';

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

      const storedErrors = storage.getJson<unknown>(StorageKey.ErrorBoundaryErrors);
      const errors = Array.isArray(storedErrors) ? storedErrors : [];
      errors.push(errorLog);

      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }

      storage.setJson(StorageKey.ErrorBoundaryErrors, errors);
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
function ErrorDisplay({
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
      className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}
    >
      <div className='max-w-md space-y-4'>
        {/* Error icon */}
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20'>
          <ExclamationTriangleIcon
            className='h-8 w-8 text-red-600 dark:text-red-400'
            strokeWidth={2}
          />
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
            <Button onClick={onRetry} className='py-2'>
              重试
            </Button>
          )}
          <Button onClick={() => window.location.reload()} variant='secondary' className='py-2'>
            刷新页面
          </Button>
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
