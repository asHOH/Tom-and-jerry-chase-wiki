'use client';

import { useUser } from '@/hooks/useUser';

const ACTION_LABELS = {
  edit: '编辑内容',
  upload: '上传图片',
  create_account: '创建账户',
  email: '使用邮件功能',
} as const;

const formatExpiry = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('zh-CN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(value))
    : '无限期';

export default function BlockStatusBanner() {
  const { blockSummary } = useUser();
  if (blockSummary.length === 0) return null;

  return (
    <aside
      role='status'
      className='border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100'
    >
      <div className='mx-auto max-w-7xl'>
        <p className='font-semibold'>您的账户当前受到部分限制</p>
        <ul className='mt-1 list-inside list-disc'>
          {blockSummary.map((item) => (
            <li key={`${item.action}:${item.blockId}`}>
              {ACTION_LABELS[item.action]}：{item.reason}（到期：{formatExpiry(item.expiresAt)}）
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
