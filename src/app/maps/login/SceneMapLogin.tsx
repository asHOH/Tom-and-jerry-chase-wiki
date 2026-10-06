'use client';

import { useState } from 'react';

import { useMobile } from '@/hooks/useMediaQuery';
import { useUser } from '@/hooks/useUser';
import LoginDialog from '@/components/LoginDialog';

export default function SceneMapLogin() {
  const [open, setOpen] = useState(true);
  const mobile = useMobile();
  const { nickname } = useUser();
  return (
    <main className='mx-auto max-w-lg p-6'>
      <h1 className='mb-4 text-2xl font-bold'>地图编辑登录</h1>
      <p className='mb-4'>
        {nickname
          ? `已登录为 ${nickname}。`
          : '使用猫鼠百科账号登录。匿名标注提交仍按主站规则开放。'}
      </p>
      <p className='mb-4'>登录后返回原地图窗口，点击“刷新已发布版本”更新登录状态。</p>
      {!nickname && (
        <button className='rounded border px-4 py-2' onClick={() => setOpen(true)}>
          登录 / 注册
        </button>
      )}
      <LoginDialog open={open && !nickname} onClose={() => setOpen(false)} isMobile={mobile} />
    </main>
  );
}
