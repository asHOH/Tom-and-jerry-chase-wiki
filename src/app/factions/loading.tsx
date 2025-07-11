export default function Loading() {
  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6' style={{ paddingTop: '80px' }}>
      <div className='animate-pulse'>
        {/* Header skeleton */}
        <div className='text-center space-y-4 mb-8 px-4'>
          <div className='h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto'></div>
          <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto'></div>
        </div>

        {/* Filter skeleton */}
        <div className='flex justify-center items-center gap-4 mt-4'>
          <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-20'></div>
          <div className='flex gap-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-16'></div>
            ))}
          </div>
        </div>

        {/* Character grid skeleton */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-8'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className='space-y-4'>
              <div className='h-48 bg-gray-200 dark:bg-gray-700 rounded'></div>
              <div className='px-6 pt-1 pb-6 text-center space-y-2'>
                <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto'></div>
                <div className='flex justify-center gap-1'>
                  <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-12'></div>
                  <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-16'></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        <div className='flex justify-center items-center py-8'>
          <div className='flex items-center space-x-3'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-500'></div>
            <span className='text-gray-600 dark:text-gray-400'>加载角色列表中...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
