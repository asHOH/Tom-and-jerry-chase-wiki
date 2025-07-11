export default function Loading() {
  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6' style={{ paddingTop: '80px' }}>
      <div className='animate-pulse'>
        {/* Back link skeleton */}
        <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-6'></div>

        {/* Character header skeleton */}
        <div className='text-center space-y-4 mb-8'>
          <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto'></div>
          <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto'></div>
        </div>

        {/* Character image and basic info skeleton */}
        <div className='flex flex-col lg:flex-row gap-8 mb-8'>
          <div className='lg:w-1/3'>
            <div className='h-64 bg-gray-200 dark:bg-gray-700 rounded'></div>
          </div>
          <div className='lg:w-2/3 space-y-4'>
            <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4'></div>
            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full'></div>
            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6'></div>
            <div className='flex gap-2'>
              <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-16'></div>
              <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-20'></div>
            </div>
          </div>
        </div>

        {/* Content sections skeleton */}
        <div className='space-y-6'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='border rounded-lg p-6 border-gray-200 dark:border-gray-700'>
              <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4'></div>
              <div className='space-y-2'>
                <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full'></div>
                <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5'></div>
                <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/5'></div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        <div className='flex justify-center items-center py-8'>
          <div className='flex items-center space-x-3'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-500'></div>
            <span className='text-gray-600 dark:text-gray-400'>加载角色详情中...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
