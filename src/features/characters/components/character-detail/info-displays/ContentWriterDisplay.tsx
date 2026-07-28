import { useState } from 'react';

import { cn } from '@/lib/design';
import type { ContentEditor } from '@/lib/types';
import { getContentWritersByCharacter } from '@/constants';

interface ContentWriterDisplayProps {
  characterId: string;
  contentWriters?: readonly string[];
  contentEditors?: readonly ContentEditor[];
  type?: 'default' | 'isMobile';
}

export default function ContentWriterDisplay({
  characterId,
  contentWriters,
  contentEditors = [],
  type,
}: ContentWriterDisplayProps) {
  const staticContentWriters = [...new Set(getContentWritersByCharacter(characterId))];
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMainWriters = staticContentWriters.length > 0;
  const hasExtraEditors = contentEditors.length > 0;

  if (!hasMainWriters && !hasExtraEditors && (contentWriters?.length ?? 0) === 0) {
    return null;
  }

  const editorLine = hasExtraEditors ? (
    <div className='text-xs text-gray-400 dark:text-gray-500'>
      文案编辑：
      <span className={type === 'isMobile' ? '' : 'whitespace-pre'}>
        {contentEditors.map((editor, index) => (
          <span key={editor.id}>
            {index > 0 && '、'}
            <a href={`/users/${encodeURIComponent(editor.id)}`} className='underline'>
              {editor.name}
            </a>
          </span>
        ))}
      </span>
    </div>
  ) : null;

  if (!hasMainWriters) {
    return editorLine;
  }

  return (
    <>
      <div
        className={cn('text-xs text-gray-400 dark:text-gray-500', type !== 'isMobile' && 'mt-2')}
      >
        文案撰写：
        <span className={type === 'isMobile' ? '' : 'whitespace-pre'}>
          {staticContentWriters.join('、')}
        </span>
        {hasExtraEditors && !isExpanded && (
          <button
            type='button'
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className='ml-1 cursor-pointer transition-colors hover:text-gray-600 dark:hover:text-gray-300'
            aria-expanded={isExpanded}
            aria-label='展开文案编辑者'
          >
            、...
          </button>
        )}
      </div>
      {isExpanded && editorLine}
    </>
  );
}
