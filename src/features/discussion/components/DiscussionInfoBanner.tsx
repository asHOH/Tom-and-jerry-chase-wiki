'use client';

type DiscussionInfoBannerProps = {
  entityTitle: string;
  entityTypeLabel: string;
};

export function DiscussionInfoBanner({ entityTitle, entityTypeLabel }: DiscussionInfoBannerProps) {
  const showTypeLabel = entityTitle !== entityTypeLabel;

  return (
    <div className='mb-6 rounded-lg border border-blue-200 bg-blue-50/60 px-5 py-3 text-sm text-gray-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-gray-300'>
      <p>
        这是 <strong className='font-semibold'>{entityTitle}</strong>
        {showTypeLabel && (
          <>
            （<strong className='font-semibold'>{entityTypeLabel}</strong>）
          </>
        )}
        的讨论页，用于讨论该页面的改进与维护。
      </p>
      <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>签名会自动附加在留言末尾。</p>
    </div>
  );
}
