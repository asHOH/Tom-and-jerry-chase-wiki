import { NextRequest, NextResponse } from 'next/server';

import { getArticleHistory } from '@/lib/articles/serverQueries';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimit(request, 'read', 'articles-history');
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
  }

  try {
    const response = await getArticleHistory(id);

    if ('error' in response) {
      const status =
        response.error === 'Articles disabled' || response.error === 'Article not found'
          ? 404
          : 500;
      return NextResponse.json(response, { status });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
