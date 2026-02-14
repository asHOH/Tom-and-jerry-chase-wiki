import docPagesJson from '@/data/generated/docPages.json';

import { convertToPinyin } from '../pinyinUtils';
import type { SearchResult } from './types';

type DocPage = {
  title: string;
  slug: string;
  path: string;
};

const isDocPageLike = (x: unknown): x is DocPage => {
  if (!x || typeof x !== 'object') return false;
  const rec = x as Record<string, unknown>;
  return (
    typeof rec.title === 'string' && typeof rec.slug === 'string' && typeof rec.path === 'string'
  );
};

const getDocPages = (): DocPage[] => {
  const raw: unknown[] = Array.isArray(docPagesJson) ? (docPagesJson as unknown[]) : [];
  return raw
    .filter(isDocPageLike)
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
};

export async function* searchDocs(
  findMatchContext: (texts: (string | undefined)[]) => Promise<string | undefined>,
  lowerCaseQuery: string,
  pinyinQuery: string
): AsyncGenerator<SearchResult> {
  const docPages = getDocPages();

  for (const page of docPages) {
    let matchContext: string | undefined;
    let priority = 0;
    let isPinyinMatch = false;

    const titleLowerCase = page.title.toLowerCase();
    const titlePinyin = await convertToPinyin(page.title);
    const slugLowerCase = page.slug.toLowerCase();
    const slugPinyin = await convertToPinyin(page.slug);

    if (titleLowerCase.includes(lowerCaseQuery)) {
      matchContext = await findMatchContext([page.title]);
      priority = 1.0;
      isPinyinMatch = false;
    } else if (titlePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = await findMatchContext([page.title]);
      priority = 0.95;
      isPinyinMatch = true;
    } else if (slugLowerCase.includes(lowerCaseQuery)) {
      matchContext = await findMatchContext([page.slug]);
      priority = 0.9;
      isPinyinMatch = false;
    } else if (slugPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = await findMatchContext([page.slug]);
      priority = 0.85;
      isPinyinMatch = true;
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield {
        type: 'doc',
        name: page.title,
        slug: page.slug,
        path: page.path,
        matchContext,
        priority,
        isPinyinMatch,
      };
    }
  }
}
