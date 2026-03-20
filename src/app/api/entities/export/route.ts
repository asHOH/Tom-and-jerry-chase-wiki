import { NextResponse } from 'next/server';

import { entityDefinitions } from '@/features/entities/data/entities';

export const dynamic = 'force-static';
export const revalidate = 3600;
export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json(
    {
      source: 'site-data',
      total: Object.keys(entityDefinitions).length,
      entities: entityDefinitions,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
