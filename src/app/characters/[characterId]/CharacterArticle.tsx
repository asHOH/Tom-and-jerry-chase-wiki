'use client';

import CharacterSection from '@/components/displays/characters/character-detail/CharacterSection';
import StyledMDX from '@/components/ui/StyledMDX';
import { sanitizeHTML } from '@/lib/xssUtils';
import { use, useLayoutEffect, useState } from 'react';

export default function CharacterDocs({
  content,
  authors,
}: {
  content: Promise<{
    id: string | null;
    content: string | null;
  } | null>;
  authors: string[];
}) {
  const result = use(content);

  const [displayContent, setDisplayContent] = useState<string | null>(null);
  useLayoutEffect(() => {
    if (result?.content) setDisplayContent(sanitizeHTML(result.content, { removeH1: true }));
  }, [result]);

  return result && displayContent ? (
    <CharacterSection title='操作技巧' to={`/articles/${encodeURIComponent(result.id!)}`}>
      {authors.length > 0 && (
        <div className='text-sm text-gray-500 dark:text-gray-400 mx-2 mb-2'>
          作者：{authors.join('、')}
        </div>
      )}
      <StyledMDX dangerouslySetInnerHTML={{ __html: displayContent }} />
    </CharacterSection>
  ) : null;
}
