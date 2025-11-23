export default function Loading() {
  return (
    <div className='mx-auto max-w-4xl space-y-6 p-6' style={{ paddingTop: '80px' }}>
      <div className='animate-pulse'>
        {/* Back link skeleton */}
        <div className='mb-6 h-4 w-24 rounded bg-gray-200 dark:bg-gray-700'></div>

        {/* Character header skeleton */}
        <div className='mb-8 space-y-4 text-center'>
          <div className='mx-auto h-10 w-1/3 rounded bg-gray-200 dark:bg-gray-700'></div>
          <div className='mx-auto h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-700'></div>
        </div>

        {/* Character image and basic info skeleton */}
        <div className='mb-8 flex flex-col gap-8 lg:flex-row'>
          <div className='lg:w-1/3'>
            <div className='h-64 rounded bg-gray-200 dark:bg-gray-700'></div>
          </div>
          <div className='space-y-4 lg:w-2/3'>
            <div className='h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700'></div>
            <div className='h-4 w-full rounded bg-gray-200 dark:bg-gray-700'></div>
            <div className='h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700'></div>
            <div className='flex gap-2'>
              <div className='h-6 w-16 rounded bg-gray-200 dark:bg-gray-700'></div>
              <div className='h-6 w-20 rounded bg-gray-200 dark:bg-gray-700'></div>
            </div>
          </div>
        </div>

        {/* Content sections skeleton */}
        <div className='space-y-6'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='rounded-lg border border-gray-200 p-6 dark:border-gray-700'>
              <div className='mb-4 h-6 w-1/4 rounded bg-gray-200 dark:bg-gray-700'></div>
              <div className='space-y-2'>
                <div className='h-4 w-full rounded bg-gray-200 dark:bg-gray-700'></div>
                <div className='h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-700'></div>
                <div className='h-4 w-3/5 rounded bg-gray-200 dark:bg-gray-700'></div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        <div className='flex items-center justify-center py-8'>
          <div className='flex items-center space-x-3'>
            <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-500'></div>
            <span className='text-gray-600 dark:text-gray-400'>加载角色详情中...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
