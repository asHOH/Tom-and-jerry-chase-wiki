'use client';

import { cn } from '@/lib/design';
import { useFeatureDiscovery } from '@/hooks/useFeatureDiscovery';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import Button from '@/components/ui/Button';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PencilSquareIcon } from '@/components/icons/CommonIcons';
import { prepareEditingOnIntent } from '@/components/panelModules';

export type EditButtonProps = {
  className?: string;
  compact?: boolean;
};

export default function EditButton({ className, compact = false }: EditButtonProps) {
  const { isEditMode, enterEditMode } = useSearchParamEditMode();
  const { shouldPrompt: showEditHint, dismiss: dismissEditHint } =
    useFeatureDiscovery('edit_button');
  const title = '编辑此页面';

  const handleEnterEditMode = () => {
    prepareEditingOnIntent();
    if (showEditHint) dismissEditHint();
    enterEditMode();
  };

  if (isEditMode) return null;

  if (compact) {
    return (
      <IconButton
        type='button'
        aria-label={title}
        title={title}
        variant='edit'
        size='sm'
        className={cn(showEditHint && 'edit-button-sheen', className)}
        onClick={handleEnterEditMode}
        onPointerEnter={prepareEditingOnIntent}
        onFocus={prepareEditingOnIntent}
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
      className={cn(showEditHint && 'edit-button-sheen', className)}
      onClick={handleEnterEditMode}
      onPointerEnter={prepareEditingOnIntent}
      onFocus={prepareEditingOnIntent}
      leadingIcon={<PencilSquareIcon className='h-4 w-4' aria-hidden='true' />}
      title={title}
    >
      编辑
    </Button>
  );
}
