'use client';

import { use, useLayoutEffect, useState } from 'react';

import { sanitizeHTML } from '@/lib/xssUtils';
import CharacterSection from '@/features/characters/components/character-detail/CharacterSection';
import AccordionCard from '@/components/ui/AccordionCard';
import CollapseCard from '@/components/ui/CollapseCard';
import StyledMDX from '@/components/ui/StyledMDX';

type CharacterArticleItem = {
  id: string | null;
  title?: string | null;
  content: string | null;
  authors: string[];
};

type CharacterArticleResult = CharacterArticleItem | CharacterArticleItem[] | null;

export default function CharacterArticle({
  content,
}: {
  content: Promise<CharacterArticleResult>;
}) {
  const result = use(content);

  const articles: CharacterArticleItem[] = Array.isArray(result) ? result : result ? [result] : [];

  const [displayContentById, setDisplayContentById] = useState<Record<string, string>>({});
  useLayoutEffect(() => {
    const nextArticles: CharacterArticleItem[] = Array.isArray(result)
      ? result
      : result
        ? [result]
        : [];

    if (!nextArticles || nextArticles.length === 0) {
      setDisplayContentById({});
      return;
    }

    const nextMap: Record<string, string> = {};
    for (const item of nextArticles) {
      if (!item?.id || !item?.content) continue;
      nextMap[item.id] = sanitizeHTML(item.content, { removeH1: true });
    }
    setDisplayContentById(nextMap);
  }, [result]);

  if (articles.length === 0) {
    return null;
  }

  if (articles.length === 1) {
    const single = articles[0];
    if (!single?.id) return null;
    const displayContent = displayContentById[single.id];
    if (!displayContent) return null;

    const authors = single.authors ?? [];
    return (
      <CharacterSection title='操作技巧' to={`/articles/${encodeURIComponent(single.id)}`}>
        {authors.length > 0 && (
          <div className='mx-2 mb-2 text-sm text-gray-500 dark:text-gray-400'>
            作者：{authors.join('、')}
          </div>
        )}
        <StyledMDX
          className='mx-0 max-w-none p-0 sm:p-0'
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      </CharacterSection>
    );
  }

  const normalizedArticles = articles.filter((a): a is CharacterArticleItem & { id: string } =>
    Boolean(a?.id)
  );
  const firstId = normalizedArticles[0]?.id;

  if (!firstId) {
    return null;
  }

  return (
    <CharacterSection title='操作技巧'>
      <div className='mx-2'>
        <AccordionCard
          defaultOpenId={firstId}
          size='xs'
          titleClassName='rounded-md'
          contentContainerClassName='mt-2'
          buttonClassName='px-2'
          activeButtonClassName='italic underline'
          items={normalizedArticles.map((article) => {
            const id = article.id;
            const title = article.title?.trim() || '文章';
            const authorsText =
              article.authors && article.authors.length > 0 ? article.authors.join('、') : '未知';

            const displayContent = displayContentById[id];

            return {
              id,
              title: authorsText,
              className: 'py-2',
              children: (
                <CollapseCard
                  title={title}
                  size='xs'
                  color='default'
                  className='rounded-md border-x border-b border-gray-300 px-1 pb-1 dark:border-gray-700'
                >
                  <div className='px-1 py-2'>
                    {displayContent ? (
                      <StyledMDX
                        className='mx-0 max-w-none p-0 sm:p-0'
                        dangerouslySetInnerHTML={{ __html: displayContent }}
                      />
                    ) : null}
                  </div>
                </CollapseCard>
              ),
            };
          })}
        />
      </div>
    </CharacterSection>
  );
}
