export default function Loading() {
  return (
    <div className='mx-auto max-w-7xl space-y-8 p-6 pt-20'>
      <div className='animate-pulse'>
        {/* Header skeleton */}
        <div className='mb-8 space-y-4 px-4 text-center'>
          <div className='mx-auto h-10 w-1/3 rounded bg-gray-200 dark:bg-gray-700'></div>
          <div className='mx-auto h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-700'></div>
        </div>

        {/* Property selector skeleton */}
        <div className='mx-auto mb-8 max-w-4xl px-4'>
          <div className='space-y-6'>
            <div className='space-y-3'>
              <div className='h-4 w-20 rounded bg-gray-200 dark:bg-gray-700'></div>
              <div className='flex flex-wrap gap-2'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className='h-10 w-20 rounded bg-gray-200 dark:bg-gray-700'></div>
                ))}
              </div>
            </div>
            <div className='space-y-3'>
              <div className='h-4 w-24 rounded bg-gray-200 dark:bg-gray-700'></div>
              <div className='flex flex-wrap gap-2'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='h-10 w-24 rounded bg-gray-200 dark:bg-gray-700'></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rankings grid skeleton */}
        <div className='mx-auto max-w-6xl px-4'>
          <div className='grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6'>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className='space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800'
              >
                {/* Rank and value badges skeleton */}
                <div className='flex items-center justify-between'>
                  <div className='h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700'></div>
                  <div className='h-6 w-12 rounded bg-gray-200 dark:bg-gray-700'></div>
                </div>

                {/* Character image skeleton */}
                <div className='flex justify-center'>
                  <div className='h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700'></div>
                </div>

                {/* Character name skeleton */}
                <div className='text-center'>
                  <div className='mx-auto h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700'></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading indicator */}
        <div className='flex items-center justify-center py-8'>
          <div className='flex items-center space-x-3'>
            <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-500'></div>
            <span className='text-gray-600 dark:text-gray-400'>加载排行榜数据中...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
