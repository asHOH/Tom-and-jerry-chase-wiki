import { NextResponse, type NextRequest } from 'next/server';

import { getGotoResult } from '@/lib/gotoUtils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const category = request.nextUrl.searchParams.get('category') ?? undefined;
  const rawDescMode =
    request.nextUrl.searchParams.get('descMode') ??
    request.nextUrl.searchParams.get('skillDesc') ??
    undefined;
  const descMode =
    rawDescMode === 'description' || rawDescMode === 'detailed' ? rawDescMode : undefined;
  return NextResponse.json(
    await getGotoResult(name, category, descMode ? { descMode } : undefined)
  );
}
