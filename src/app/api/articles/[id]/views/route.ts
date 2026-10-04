import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { incrementArticleViewCount } from '@/lib/articles/server/detailQueries';
import { getPublicReadClient } from '@/lib/articles/server/readClient';
import { checkRateLimit } from '@/lib/rateLimit';
import { SITE_URL } from '@/constants/seo';

type RouteContext = { params: Promise<{ id: string }> };
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

async function respond(request: NextRequest, { params }: RouteContext, recordView: boolean) {
  try {
    if (recordView) {
      const origin = request.headers.get('origin');
      if (origin !== request.nextUrl.origin && origin !== new URL(SITE_URL).origin) {
        return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
      }
    }
    const rl = await checkRateLimit(request, 'read', 'article-views');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rl.headers }
      );
    }
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }
    const client = getPublicReadClient();
    if (!client) {
      return NextResponse.json({ error: 'Articles disabled' }, { status: 404 });
    }
    const { data: article, error } = await client
      .from('articles')
      .select(
        'view_count, current_version:article_versions_public_view!articles_current_version_id_fkey!inner(status)'
      )
      .eq('id', id)
      .eq('current_version.status', 'approved')
      .maybeSingle();
    if (error) throw error;
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    if (recordView) await incrementArticleViewCount(id);
    // View counts must not invalidate cached article content.
    return NextResponse.json({ viewCount: article.view_count }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Article views request failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export function GET(request: NextRequest, context: RouteContext) {
  return respond(request, context, false);
}

export function POST(request: NextRequest, context: RouteContext) {
  return respond(request, context, true);
}
