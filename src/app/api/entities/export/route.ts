import { NextResponse } from 'next/server';

import { catEntitiesDefinitions } from '@/data/catEntities';
import { mouseEntitiesDefinitions } from '@/data/mouseEntities';

export const dynamic = 'force-static';
export const revalidate = 3600;
export const runtime = 'edge';

export function GET() {
  const combined = {
    ...catEntitiesDefinitions,
    ...mouseEntitiesDefinitions,
  };

  return NextResponse.json(
    {
      source: 'site-data',
      total: Object.keys(combined).length,
      entities: combined,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
