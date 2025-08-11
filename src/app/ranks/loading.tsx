export default function Loading() {
  return (
    <div className='max-w-7xl mx-auto p-6 space-y-8' style={{ paddingTop: '80px' }}>
      <div className='animate-pulse'>
        {/* Header skeleton */}
        <div className='text-center space-y-4 mb-8 px-4'>
          <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto'></div>
          <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto'></div>
        </div>

        {/* Property selector skeleton */}
        <div className='max-w-4xl mx-auto px-4 mb-8'>
          <div className='space-y-6'>
            <div className='space-y-3'>
              <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-20'></div>
              <div className='flex flex-wrap gap-2'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className='h-10 bg-gray-200 dark:bg-gray-700 rounded w-20'></div>
                ))}
              </div>
            </div>
            <div className='space-y-3'>
              <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-24'></div>
              <div className='flex flex-wrap gap-2'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='h-10 bg-gray-200 dark:bg-gray-700 rounded w-24'></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rankings grid skeleton */}
        <div className='max-w-6xl mx-auto px-4'>
          <div
            className='grid gap-6'
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className='bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 space-y-3'
              >
                {/* Rank and value badges skeleton */}
                <div className='flex items-center justify-between'>
                  <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16'></div>
                  <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-12'></div>
                </div>

                {/* Character image skeleton */}
                <div className='flex justify-center'>
                  <div className='w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full'></div>
                </div>

                {/* Character name skeleton */}
                <div className='text-center'>
                  <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto'></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading indicator */}
        <div className='flex justify-center items-center py-8'>
          <div className='flex items-center space-x-3'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-500'></div>
            <span className='text-gray-600 dark:text-gray-400'>加载排行榜数据中...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
