'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { checkPasswordStrength, type PasswordStrength } from '@/lib/passwordUtils';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormControls';
import Notice from '@/components/ui/Notice';
import SectionHeader from '@/components/ui/SectionHeader';

export default function ChangePasswordSettings() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(null);
      return;
    }
    void checkPasswordStrength(newPassword).then(setPasswordStrength);
  }, [newPassword]);

  const strengthText = useMemo(() => {
    if (!passwordStrength) return null;
    const prefix =
      passwordStrength.strength <= 1 ? '弱' : passwordStrength.strength === 2 ? '一般' : '良好';
    return `${prefix}：${passwordStrength.reason}`;
  }, [passwordStrength]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);

    if (!newPassword) {
      setErrorMessage('新密码不能为空。');
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
      if (!response.ok) throw new Error(data.error || '修改密码失败。');

      success(data.message || '密码修改成功。');
      setOldPassword('');
      setNewPassword('');
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '修改密码失败。';
      setErrorMessage(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card as='section' bordered>
      <SectionHeader id='account' title='账号安全' variant='compact' />
      <form className='max-w-xl space-y-4' onSubmit={submit}>
        {errorMessage ? <Notice variant='error'>{errorMessage}</Notice> : null}
        <div>
          <label
            htmlFor='settings-old-password'
            className='mb-1 block text-sm text-gray-700 dark:text-gray-200'
          >
            旧密码（如果已设置）
          </label>
          <FormInput
            id='settings-old-password'
            type='password'
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
            autoComplete='current-password'
          />
        </div>
        <div>
          <label
            htmlFor='settings-new-password'
            className='mb-1 block text-sm text-gray-700 dark:text-gray-200'
          >
            新密码
          </label>
          <FormInput
            id='settings-new-password'
            type='password'
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete='new-password'
            required
          />
          {strengthText ? (
            <p className='mt-1 text-xs text-gray-600 dark:text-gray-300'>{strengthText}</p>
          ) : null}
        </div>
        <Button type='submit' loading={isLoading}>
          确认修改密码
        </Button>
      </form>
    </Card>
  );
}
