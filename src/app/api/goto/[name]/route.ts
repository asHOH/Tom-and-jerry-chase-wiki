import { getGotoResult } from '@/lib/gotoUtils';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  return NextResponse.json(await getGotoResult(name));
}
