'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { checkPasswordStrength, PasswordStrength } from '@/lib/passwordUtils';
import { useToast } from '@/context/ToastContext';
import { CloseIcon } from '@/components/icons/CommonIcons';

type ChangePasswordDialogProps = {
  onClose: () => void;
};

export default function ChangePasswordDialog({ onClose }: ChangePasswordDialogProps) {
  const { success, error: showError } = useToast();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(null);
      return;
    }
    checkPasswordStrength(newPassword).then(setPasswordStrength);
  }, [newPassword]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const strengthText = useMemo(() => {
    if (!passwordStrength) return null;
    const prefix =
      passwordStrength.strength <= 1 ? '弱' : passwordStrength.strength === 2 ? '一般' : '良好';
    return `${prefix}：${passwordStrength.reason}`;
  }, [passwordStrength]);

  const submit = async () => {
    if (isLoading) return;
    setErrMsg(null);

    if (!newPassword) {
      setErrMsg('新密码不能为空。');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: oldPassword || undefined, newPassword }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.error || '修改密码失败。');
      }
      success(data.message || '密码修改成功。');
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : '修改密码失败。';
      setErrMsg(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className='fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4'
      role='dialog'
      aria-modal='true'
      aria-label='修改密码'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className='w-full max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-slate-800'
      >
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-lg font-bold text-gray-900 dark:text-white'>修改密码</h2>
          <button
            type='button'
            aria-label='关闭'
            className='rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
            onClick={onClose}
          >
            <CloseIcon className='size-5' />
          </button>
        </div>

        {!!errMsg && <div className='mb-3 text-sm text-red-600 dark:text-red-400'>{errMsg}</div>}

        <div className='space-y-3'>
          <div>
            <label className='mb-1 block text-sm text-gray-700 dark:text-gray-200'>
              旧密码（如果已设置）
            </label>
            <input
              type='password'
              className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-slate-900 dark:text-white'
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder='旧密码'
              autoComplete='current-password'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm text-gray-700 dark:text-gray-200'>新密码</label>
            <input
              type='password'
              className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-slate-900 dark:text-white'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder='新密码'
              autoComplete='new-password'
            />
            {!!strengthText && (
              <div className='mt-1 text-xs text-gray-600 dark:text-gray-300'>{strengthText}</div>
            )}
          </div>

          <button
            type='button'
            className={
              isLoading
                ? 'w-full rounded-md bg-gray-300 px-3 py-2 text-gray-700 opacity-70 dark:bg-slate-700 dark:text-gray-200'
                : 'w-full rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            }
            onClick={submit}
            disabled={isLoading}
          >
            {isLoading ? '提交中…' : '确认修改'}
          </button>
        </div>
      </div>
    </div>
  );
}
