'use client';

import { useEffect, useState } from 'react';
import { useEditMode } from '@/context/EditModeContext';

export const EditModeIndicator: React.FC = () => {
  const { isEditMode } = useEditMode();
  const [isHidden, setIsHidden] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply body class when in edit mode
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isEditMode) {
        document.body.classList.add('edit-mode-banner-visible');
      } else {
        document.body.classList.remove('edit-mode-banner-visible');
      }
    }
  }, [isEditMode]);

  // Reset hidden state when edit mode changes
  useEffect(() => {
    if (isEditMode) {
      setIsHidden(false);
    }
  }, [isEditMode]);

  if (!isEditMode || isHidden || !mounted) return null;

  return (
    <div className='fixed left-0 right-0 bg-amber-600 text-white px-4 py-2 text-sm font-medium z-[9999] edit-mode-banner'>
      <div className='flex items-center justify-center space-x-2 relative'>
        <div className='w-2 h-2 bg-amber-200 rounded-full animate-pulse'></div>
        <span>
          编辑模式已开启 - 编辑全部在本地进行 - 双击主页&ldquo;网站说明&rdquo;标题可退出编辑模式
        </span>
        <button
          type='button'
          onClick={() => setIsHidden(true)}
          className='ml-4 px-2 py-1 bg-amber-700 hover:bg-amber-800 rounded text-xs transition-colors'
          aria-label='关闭编辑模式提示'
        >
          ×
        </button>
      </div>
    </div>
  );
};
