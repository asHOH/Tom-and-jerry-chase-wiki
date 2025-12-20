'use server';

import { notFound, redirect } from 'next/navigation';

import { getGotoResult } from '@/lib/gotoUtils';

export default async function GotoPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<never> {
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
  if (result) {
    redirect(result.url);
  }
  notFound();
}
