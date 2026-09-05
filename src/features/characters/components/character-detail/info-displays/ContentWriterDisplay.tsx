import { Fragment, useState } from 'react';

import { cn } from '@/lib/design';
import type { ContentEditor } from '@/lib/types';
import { contributors } from '@/data/contributors';
import Button from '@/components/ui/Button';
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
      <span>
        {contentEditors.map((editor, index) => (
          <Fragment key={editor.id}>
            <span className='whitespace-nowrap'>
              <a
                href={`/users/${encodeURIComponent(editor.name)}`}
                className='no-underline transition-colors hover:text-gray-600 dark:hover:text-gray-300'
              >
                {editor.name}
              </a>
              {index < contentEditors.length - 1 && '、'}
            </span>
            {index < contentEditors.length - 1 && <wbr />}
          </Fragment>
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
        <span>
          {staticContentWriters.map((writer, index) => {
            const contributor = contributors.find(({ name }) => name === writer);

            return (
              <Fragment key={writer}>
                <span className='whitespace-nowrap'>
                  {contributor?.nickname ? (
                    <a
                      href={`/users/${encodeURIComponent(contributor.nickname)}`}
                      className='no-underline transition-colors hover:text-gray-600 dark:hover:text-gray-300'
                    >
                      {writer}
                    </a>
                  ) : (
                    writer
                  )}
                  {index < staticContentWriters.length - 1 && '、'}
                </span>
                {index < staticContentWriters.length - 1 && <wbr />}
              </Fragment>
            );
          })}
        </span>
        {hasExtraEditors && !isExpanded && (
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className='ml-1 cursor-pointer transition-colors hover:text-gray-600 dark:hover:text-gray-300'
            aria-expanded={isExpanded}
            aria-label='展开文案编辑者'
          >
            、...
          </Button>
        )}
      </div>
      {isExpanded && editorLine}
    </>
  );
}
