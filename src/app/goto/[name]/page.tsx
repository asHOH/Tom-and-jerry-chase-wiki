'use server';

import { redirect, notFound } from 'next/navigation';
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
  const result = await getGotoResult(name, category);
  if (result) {
    redirect(result.url);
  }
  notFound();
}
