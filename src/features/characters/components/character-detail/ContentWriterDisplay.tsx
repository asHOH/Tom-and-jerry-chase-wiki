import { getContentWritersByCharacter } from '@/constants';

interface ContentWriterDisplayProps {
  characterId: string;
  type?: 'default' | 'isMobile';
}

export default function ContentWriterDisplay({ characterId, type }: ContentWriterDisplayProps) {
  const contentWriters = getContentWritersByCharacter(characterId);

  if (contentWriters.length === 0) {
    return null;
  }

  return (
    <div
      className={`text-xs text-gray-400 dark:text-gray-500 ${type === 'isMobile' ? '' : 'mt-2'}`}
    >
      文案撰写：
      <span className={type === 'isMobile' ? '' : 'whitespace-pre'}>
        {contentWriters.join('、')}
      </span>
    </div>
  );
}
