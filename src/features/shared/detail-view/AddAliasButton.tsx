import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PlusIcon } from '@/components/icons/CommonIcons';

type AddAliasButtonProps = {
  onAdd: () => void;
};

export default function AddAliasButton({ onAdd }: AddAliasButtonProps) {
  return (
    <IconButton
      type='button'
      aria-label='添加别名'
      variant='add'
      size='xs'
      className='ml-2'
      onClick={onAdd}
    >
      <PlusIcon className={getIconButtonIconClassName('xs')} aria-hidden='true' />
    </IconButton>
  );
}
