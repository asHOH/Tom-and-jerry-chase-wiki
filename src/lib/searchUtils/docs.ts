import docPagesJson from '@/data/generated/docPages.json';

import type { SearchQuery } from './matching';
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

export async function searchDocs(query: SearchQuery): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const page of getDocPages()) {
    const match = await query.matchFields([
      [page.title, 1, 0.95],
      [page.slug, 0.9, 0.85],
    ]);
    if (match)
      results.push({ type: 'doc', name: page.title, slug: page.slug, path: page.path, ...match });
  }
  return results;
}
