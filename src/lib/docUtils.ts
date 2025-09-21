'use server';

import docPagesJson from '@/data/generated/docPages.json';

export interface DocPage {
  title: string;
  slug: string;
  path: string;
}

function isDocPageLike(x: unknown): x is DocPage {
  if (!x || typeof x !== 'object') return false;
  const rec = x as Record<string, unknown>;
  return (
    typeof rec.title === 'string' && typeof rec.slug === 'string' && typeof rec.path === 'string'
  );
}

export async function getDocPages(): Promise<DocPage[]> {
  const raw: unknown[] = Array.isArray(docPagesJson) ? (docPagesJson as unknown[]) : [];
  // Ensure shape and stable ordering
  return raw
    .filter(isDocPageLike)
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
}

export async function getTutorialPage(id: string): Promise<DocPage | null> {
  const docPages = await getDocPages();
  return docPages.find((page) => page.title == `${id}操作技巧`) ?? null;
}
