import { NextRequest, NextResponse } from 'next/server';

import { getPaginatedArticles } from '@/lib/articles/serverQueries';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, 'read', 'articles-list');
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '18');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  try {
    const payload = await getPaginatedArticles({
      page,
      limit,
      category,
      search,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(payload);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
