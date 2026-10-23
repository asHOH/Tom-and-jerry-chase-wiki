'use client';

import { useEffect, useId, useState } from 'react';

import { storage, StorageKey } from '@/lib/localStorage';
import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';

export default function BrowserCompatibilityWarning() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isBaiduBrowser =
      ua.includes('baidubrowser') ||
      ua.includes('bdbrowser') ||
      (ua.includes('baidu') && ua.includes('android'));
    if (!isBaiduBrowser) return;

    // Preserve choices made with the former server-side browser gate.
    const hasLegacyOverride =
      new URLSearchParams(window.location.search).get('force_continue') === '1' ||
      document.cookie.split(';').some((cookie) => cookie.trim() === 'force_continue=1');
    if (hasLegacyOverride) {
      storage.setItem(StorageKey.BrowserCompatibilityDismissed, '1');
      return;
    }

    setOpen(storage.getItem(StorageKey.BrowserCompatibilityDismissed) !== '1');
  }, []);

  const dismiss = () => {
    setOpen(false);
    // Storage is best effort; dismissal still works when browser storage is unavailable.
    storage.setItem(StorageKey.BrowserCompatibilityDismissed, '1');
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) dismiss();
      }}
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
      size='sm'
      panelClassName='p-6'
    >
      <h2 id={titleId} className='text-lg font-semibold'>
        浏览器兼容性提示
      </h2>
      <p id={descriptionId} className='text-muted-foreground mt-3 text-sm leading-relaxed'>
        检测到您正在使用百度浏览器，本站部分功能可能无法正常使用。如遇问题，建议使用 Chrome 或
        Firefox 浏览器访问。
      </p>
      <ul className='mt-4 flex flex-wrap gap-4 text-sm'>
        <li>
          <a
            href='https://www.google.cn/chrome/'
            target='_blank'
            rel='noopener noreferrer'
            className='focus-visible:ring-focus rounded text-blue-700 underline hover:text-blue-800 focus-visible:ring-2 focus-visible:outline-none dark:text-blue-300 dark:hover:text-blue-200'
          >
            Chrome 浏览器
          </a>
        </li>
        <li>
          <a
            href='https://www.firefox.com/zh-CN/browsers/mobile/android/'
            target='_blank'
            rel='noopener noreferrer'
            className='focus-visible:ring-focus rounded text-blue-700 underline hover:text-blue-800 focus-visible:ring-2 focus-visible:outline-none dark:text-blue-300 dark:hover:text-blue-200'
          >
            Firefox 浏览器
          </a>
        </li>
      </ul>
      <Button onClick={dismiss} fullWidth className='mt-6'>
        继续访问，不再提示
      </Button>
    </BaseDialog>
  );
}
