export default function CreateDateDisplay({ createDate }: { createDate: string | null }) {
  if (!createDate) {
    return null;
  }

  return (
    <div className='mt-2 text-xs text-gray-400 md:mt-0 dark:text-gray-500'>
      角色上线时间：
      <span className='md:whitespace-pre'>{createDate}</span>
    </div>
  );
}
