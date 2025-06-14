'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-100'>
          <div className='max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg'>
            <h2 className='text-2xl font-bold text-red-600 mb-4'>出错了</h2>
            <p className='text-gray-600 mb-4'>页面遇到了一些问题，请刷新页面重试。</p>
            <button
              onClick={() => window.location.reload()}
              className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors'
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
