import { PlusIcon } from '@/components/icons/CommonIcons';

type AddAliasButtonProps = {
  onAdd: () => void;
};

export default function AddAliasButton({ onAdd }: AddAliasButtonProps) {
  return (
    <button
      type='button'
      aria-label='添加别名'
      onClick={onAdd}
      className='ml-2 flex h-4 w-4 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
    >
      <PlusIcon className='h-3 w-3' aria-hidden='true' />
    </button>
  );
}
