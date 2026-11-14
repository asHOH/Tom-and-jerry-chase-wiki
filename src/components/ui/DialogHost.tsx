'use client';

import { useId, useState, useSyncExternalStore } from 'react';

import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';
import {
  finishDialog,
  getDialog,
  subscribeDialogs,
  type DialogRequest,
} from '@/components/ui/dialogs';
import { FormInput, FormTextarea } from '@/components/ui/FormControls';

const noDialog = () => null;

function ActiveDialog({ request }: { request: DialogRequest }) {
  const [value, setValue] = useState(request.defaultValue ?? '');
  const descriptionId = useId();
  const cancel = () => finishDialog(request, request.kind === 'confirm' ? false : null);
  return (
    <BaseDialog
      open
      onOpenChange={(open) => {
        if (!open) cancel();
      }}
      role={request.kind === 'prompt' ? 'dialog' : 'alertdialog'}
      ariaLabel={request.kind === 'prompt' ? '输入' : '提示'}
      ariaDescribedBy={descriptionId}
      size='sm'
      closeOnOutsideClick={request.kind !== 'alert'}
    >
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault();
          finishDialog(request, request.kind === 'prompt' ? value : true);
        }}
      >
        <p id={descriptionId} className='whitespace-pre-wrap text-gray-900 dark:text-slate-100'>
          {request.message}
        </p>
        {request.kind === 'prompt' &&
          (request.selectText ? (
            <FormTextarea
              aria-label={request.message}
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onFocus={(event) => event.currentTarget.select()}
              rows={5}
            />
          ) : (
            <FormInput
              aria-label={request.message}
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          ))}
        <div className='flex justify-end gap-2'>
          {request.kind !== 'alert' && (
            <Button variant='secondary' onClick={cancel}>
              取消
            </Button>
          )}
          <Button type='submit'>确定</Button>
        </div>
      </form>
    </BaseDialog>
  );
}

export function DialogHost() {
  const request = useSyncExternalStore(subscribeDialogs, getDialog, noDialog);
  return request ? <ActiveDialog key={request.id} request={request} /> : null;
}
