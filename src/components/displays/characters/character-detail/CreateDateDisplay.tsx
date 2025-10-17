import React from 'react';

export default function CreateDateDisplay({ createDate }: { createDate: string | null }) {
  if (!createDate) {
    return null;
  }

  return (
    <div className='text-xs text-gray-400 dark:text-gray-500 mt-2 md:mt-0'>
      角色上线时间：
      <span className='md:whitespace-pre'>{createDate}</span>
    </div>
  );
}
