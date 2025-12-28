'use server';

import { notFound, redirect } from 'next/navigation';

import { getGotoResult } from '@/lib/gotoUtils';
import Link from '@/components/Link';

export default async function GotoPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const name = decodeURIComponent((await params).name);
  const sp = await searchParams;
  const category = typeof sp.category === 'string' ? sp.category : undefined;
  const rawDescMode =
    typeof sp.descMode === 'string'
      ? sp.descMode
      : typeof sp.skillDesc === 'string'
        ? sp.skillDesc
        : undefined;
  const descMode =
    rawDescMode === 'description' || rawDescMode === 'detailed' ? rawDescMode : undefined;
  const result = await getGotoResult(name, category, descMode ? { descMode } : undefined);

  if (!result) notFound();

  if (result.type !== 'disambiguation') {
    redirect(result.url);
  }

  return (
    <main className='mx-auto w-full max-w-3xl px-4 py-6 sm:px-6'>
      <h1 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
        {result.name}可能指：
      </h1>
      <ul className='mt-4 list-inside list-disc space-y-2 text-base text-gray-800 dark:text-gray-200'>
        {result.candidates.map((c) => (
          <li key={`${c.type}@@${c.url}`}>
            <Link
              href={c.url}
              className='underline decoration-solid decoration-1 underline-offset-2'
              aria-label={`前往：${c.name}（${c.categoryLabel}）`}
            >
              {c.name}（{c.categoryLabel}）
            </Link>
            <span className='text-gray-600 dark:text-gray-400'>，{c.kindDescription}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
