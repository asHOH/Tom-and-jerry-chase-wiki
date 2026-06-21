'use client';

import { useCallback } from 'react';

import { cn } from '@/lib/design';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';

type ShareButtonProps = {
  /** Returns the text to share */
  getShareText: () => string;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

/**
 * Share button that tries Web Share API first, falls back to clipboard copy.
 * Shows a toast notification on success.
 */
export default function ShareButton({
  getShareText,
  label = '分享结果',
  className,
  variant = 'primary',
  size = 'md',
}: ShareButtonProps) {
  const { copied, copy } = useCopyToClipboard();
  const { success } = useToast();

  const handleShare = useCallback(async () => {
    const text = getShareText();

    // Try Web Share API first (mobile-friendly, native share sheet)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    const ok = await copy(text);
    if (ok) {
      success('已复制到剪贴板');
    }
  }, [getShareText, copy, success]);

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      size={size}
      leadingIcon={
        <svg
          className={cn('h-4 w-4', copied && 'text-green-500')}
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={2}
        >
          {copied ? (
            <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
          ) : (
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
            />
          )}
        </svg>
      }
      className={className}
    >
      {copied ? '已复制' : label}
    </Button>
  );
}
