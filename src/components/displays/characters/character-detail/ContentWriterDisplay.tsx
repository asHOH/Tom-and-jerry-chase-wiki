import React from 'react';
import { getContentWritersByCharacter } from '@/constants';

interface ContentWriterDisplayProps {
  characterId: string;
}

export default function ContentWriterDisplay({ characterId }: ContentWriterDisplayProps) {
  const contentWriters = getContentWritersByCharacter(characterId);

  if (contentWriters.length === 0) {
    return null;
  }

  return <div className='text-xs text-gray-400 mt-2'>文案撰写：{contentWriters.join('、')}</div>;
}
