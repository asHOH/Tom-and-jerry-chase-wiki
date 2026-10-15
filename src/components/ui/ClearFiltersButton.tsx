import Button from './Button';

type ClearFiltersButtonProps = {
  onClick: () => void;
};

export default function ClearFiltersButton({ onClick }: ClearFiltersButtonProps) {
  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={onClick}
      className='filter-button cursor-pointer rounded-md border-none bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-all duration-200 hover:bg-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:focus:ring-offset-gray-900'
    >
      清除筛选
    </Button>
  );
}
