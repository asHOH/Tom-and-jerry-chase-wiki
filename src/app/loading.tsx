import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900'>
      <div className='max-w-md w-full space-y-6 p-6'>
        <div className='text-center space-y-4'>
          {/* Logo/Title skeleton */}
          <div className='animate-pulse space-y-2'>
            <Skeleton className='h-8 w-48 mx-auto' />
            <Skeleton className='h-4 w-32 mx-auto' />
          </div>

          {/* Loading spinner */}
          <div className='py-8'>
            <LoadingSpinner size='lg' message='' />
          </div>

          {/* Loading text */}
          <div className='space-y-2'>
            <p className='text-gray-700 dark:text-gray-300 font-medium'>正在加载页面...</p>
            <p className='text-gray-500 dark:text-gray-400 text-sm'>首次访问可能需要几秒钟</p>
          </div>
        </div>
      </div>
    </div>
  );
}
