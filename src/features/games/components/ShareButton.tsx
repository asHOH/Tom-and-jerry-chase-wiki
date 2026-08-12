'use client';

import { useCallback } from 'react';

import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import { CheckIcon, ShareIcon } from '@/components/icons/CommonIcons';

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
        copied ? (
          <CheckIcon className='h-4 w-4 text-green-500' />
        ) : (
          <ShareIcon className='h-4 w-4' />
        )
      }
      className={className}
    >
      {copied ? '已复制' : label}
    </Button>
  );
}
