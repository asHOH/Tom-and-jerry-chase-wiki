'use server';

import { redirect, notFound } from 'next/navigation';
import { getGotoResult } from '@/lib/gotoUtils';

export default async function GotoPage({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<never> {
  const name = decodeURIComponent((await params).name);
  const result = await getGotoResult(name);
  if (result) {
    redirect(result.url);
  }
  notFound();
}
