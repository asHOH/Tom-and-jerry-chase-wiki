import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900'>
      <div className='w-full max-w-md space-y-6 p-6'>
        <div className='space-y-4 text-center'>
          {/* Logo/Title skeleton */}
          <div className='animate-pulse space-y-2'>
            <Skeleton className='mx-auto h-8 w-48' />
            <Skeleton className='mx-auto h-4 w-32' />
          </div>

          {/* Loading spinner */}
          <div className='py-8'>
            <LoadingSpinner size='lg' message='' />
          </div>

          {/* Loading text */}
          <div className='space-y-2'>
            <p className='font-medium text-gray-700 dark:text-gray-300'>正在加载页面...</p>
            <p className='text-sm text-gray-500 dark:text-gray-400'>首次访问可能需要几秒钟</p>
          </div>
        </div>
      </div>
    </div>
  );
}
