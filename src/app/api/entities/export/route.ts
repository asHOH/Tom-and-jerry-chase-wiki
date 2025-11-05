import { NextResponse } from 'next/server';
import { catEntitiesDefinitions } from '@/data/catEntities';
import { mouseEntitiesDefinitions } from '@/data/mouseEntities';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function GET() {
  const combined = {
    ...catEntitiesDefinitions,
    ...mouseEntitiesDefinitions,
  };

  return NextResponse.json({
    source: 'site-data',
    total: Object.keys(combined).length,
    entities: combined,
  });
}
