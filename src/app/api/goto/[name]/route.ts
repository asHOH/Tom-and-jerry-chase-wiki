import { getGotoResult } from '@/lib/gotoUtils';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const category = request.nextUrl.searchParams.get('category') ?? undefined;
  return NextResponse.json(await getGotoResult(name, category));
}
