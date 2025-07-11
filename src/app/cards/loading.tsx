export default function Loading() {
  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6' style={{ paddingTop: '80px' }}>
      <div className='animate-pulse'>
        {/* Header skeleton */}
        <div className='text-center space-y-4 mb-8 px-4'>
          <div className='h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto'></div>
          <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto'></div>

          {/* Filter controls skeleton */}
          <div className='flex justify-center items-center gap-4 mt-8'>
            <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-16'></div>
            <div className='flex gap-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-12'></div>
              ))}
            </div>
          </div>

          {/* Cost range slider skeleton */}
          <div className='flex justify-center items-center gap-4 mt-4'>
            <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-16'></div>
            <div className='w-full max-w-md h-6 bg-gray-200 dark:bg-gray-700 rounded'></div>
          </div>
        </div>

        {/* Knowledge card grid skeleton */}
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8'>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className='space-y-2'>
              <div className='h-32 bg-gray-200 dark:bg-gray-700 rounded'></div>
              <div className='px-4 pt-1 pb-4 text-center space-y-1'>
                <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto'></div>
                <div className='flex justify-center gap-1'>
                  <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-8'></div>
                  <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-8'></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        <div className='flex justify-center items-center py-8'>
          <div className='flex items-center space-x-3'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-500'></div>
            <span className='text-gray-600 dark:text-gray-400'>加载知识卡列表中...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
