'use client';

import { use } from 'react';

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

const SECTION_TITLE = '\u64cd\u4f5c\u6280\u5de7';
const DEFAULT_ARTICLE_TITLE = '\u6587\u7ae0';
const UNKNOWN_AUTHOR = '\u672a\u77e5';
const AUTHOR_LABEL = '\u4f5c\u8005\uff1a';
const AUTHOR_SEPARATOR = '\u3001';

export default function CharacterArticle({
  content,
}: {
  content: Promise<CharacterArticleResult>;
}) {
  const result = use(content);

  const articles: CharacterArticleItem[] = Array.isArray(result) ? result : result ? [result] : [];

  if (articles.length === 0) {
    return null;
  }

  if (articles.length === 1) {
    const single = articles[0];
    if (!single?.id || !single.content) return null;

    const authors = single.authors ?? [];
    return (
      <CharacterSection title={SECTION_TITLE} to={`/articles/${encodeURIComponent(single.id)}`}>
        {authors.length > 0 && (
          <div className='mx-2 mb-2 text-sm text-gray-500 dark:text-gray-400'>
            {AUTHOR_LABEL}
            {authors.join(AUTHOR_SEPARATOR)}
          </div>
        )}
        <StyledMDX
          className='mx-0 max-w-none p-0 sm:p-0'
          dangerouslySetInnerHTML={{ __html: single.content }}
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
    <CharacterSection title={SECTION_TITLE}>
      <div className='mx-2'>
        <AccordionCard
          defaultOpenId={firstId}
          size='xs'
          titleClassName='rounded-md'
          contentContainerClassName='mt-2'
          buttonClassName='px-2'
          activeButtonClassName='italic underline'
          items={normalizedArticles.map((article) => {
            const title = article.title?.trim() || DEFAULT_ARTICLE_TITLE;
            const authorsText =
              article.authors && article.authors.length > 0
                ? article.authors.join(AUTHOR_SEPARATOR)
                : UNKNOWN_AUTHOR;

            return {
              id: article.id,
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
                    {article.content ? (
                      <StyledMDX
                        className='mx-0 max-w-none p-0 sm:p-0'
                        dangerouslySetInnerHTML={{ __html: article.content }}
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
