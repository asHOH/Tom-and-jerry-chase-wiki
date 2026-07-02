'use client';

import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import Button from '@/components/ui/Button';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PencilSquareIcon } from '@/components/icons/CommonIcons';

export type EditButtonProps = {
  className?: string;
  compact?: boolean;
};

export default function EditButton({ className, compact = false }: EditButtonProps) {
  const { enterEditMode } = useSearchParamEditMode();
  const title = '编辑此页面';

  if (compact) {
    return (
      <IconButton
        type='button'
        aria-label={title}
        title={title}
        variant='edit'
        size='sm'
        className={className}
        onClick={enterEditMode}
      >
        <PencilSquareIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
      </IconButton>
    );
  }

  return (
    <Button
      type='button'
      variant='primary'
      size='sm'
      className={className}
      onClick={enterEditMode}
      leadingIcon={<PencilSquareIcon className='h-4 w-4' aria-hidden='true' />}
      title={title}
    >
      编辑
    </Button>
  );
}
