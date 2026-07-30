'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { checkPasswordStrength, PasswordStrength } from '@/lib/passwordUtils';
import { useToast } from '@/context/ToastContext';
import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormControls';
import { CloseIcon } from '@/components/icons/CommonIcons';

type ChangePasswordDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const router = useRouter();
  const { success, error: showError } = useToast();

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
    if (open) return;

    setOldPassword('');
    setNewPassword('');
    setErrMsg(null);
    setIsLoading(false);
  }, [open]);

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
      router.refresh();
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
    <BaseDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      ariaLabelledBy='change-password-dialog-title'
      lockScroll={false}
      backdropClassName='z-100000'
      panelClassName='inset-auto top-1/2 left-1/2 z-100001 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 p-4'
    >
      <div className='mb-3 flex items-center justify-between'>
        <h2
          id='change-password-dialog-title'
          className='text-lg font-bold text-gray-900 dark:text-white'
        >
          修改密码
        </h2>
        <Button
          aria-label='关闭'
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0'
          onClick={onClose}
        >
          <CloseIcon className='size-5' />
        </Button>
      </div>

      {!!errMsg && <div className='mb-3 text-sm text-red-600 dark:text-red-400'>{errMsg}</div>}

      <div className='space-y-3'>
        <div>
          <label className='mb-1 block text-sm text-gray-700 dark:text-gray-200'>
            旧密码（如果已设置）
          </label>
          <FormInput
            type='password'
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder='旧密码'
            autoComplete='current-password'
          />
        </div>

        <div>
          <label className='mb-1 block text-sm text-gray-700 dark:text-gray-200'>新密码</label>
          <FormInput
            type='password'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder='新密码'
            autoComplete='new-password'
          />
          {!!strengthText && (
            <div className='mt-1 text-xs text-gray-600 dark:text-gray-300'>{strengthText}</div>
          )}
        </div>

        <Button
          onClick={submit}
          loading={isLoading}
          disabled={isLoading}
          variant='primary'
          size='md'
          fullWidth
        >
          {isLoading ? '提交中…' : '确认修改'}
        </Button>
      </div>
    </BaseDialog>
  );
}
