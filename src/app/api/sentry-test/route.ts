import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  throw new Error('Sentry Test: Server-side API Error');
  return NextResponse.json({ message: 'This should not be returned' });
}
