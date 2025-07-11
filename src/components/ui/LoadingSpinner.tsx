interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  message = '加载中...',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-500 ${sizeClasses[size]}`}
      />
      {message && (
        <span className={`text-gray-600 dark:text-gray-300 ${textSizeClasses[size]}`}>
          {message}
        </span>
      )}
    </div>
  );
}
