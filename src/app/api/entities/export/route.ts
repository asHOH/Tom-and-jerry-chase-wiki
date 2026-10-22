import { NextResponse } from 'next/server';

import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';

export const dynamic = 'force-static';
export const revalidate = 3600;
export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data } = await getPublishedDomainReadModel('entities');
    const entities = Object.fromEntries(
      Object.entries(data).map(
        ([id, { name: _name, imageUrl: _imageUrl, entitytype: _entitytype, ...definition }]) => [
          id,
          definition,
        ]
      )
    );
    return NextResponse.json(
      {
        source: 'site-data',
        total: Object.keys(entities).length,
        entities,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=39600',
        },
      }
    );
  } catch (error) {
    console.error('Error exporting published entities:', error);
    return NextResponse.json(
      { error: 'Failed to export entities' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
