import { NextRequest, NextResponse } from 'next/server';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { checkRateLimit } from '@/lib/rateLimit';
import { cached } from '@/lib/serverCache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServerPublic } from '@/lib/supabase/public';

const REVALIDATE_SECONDS = process.env.VERCEL ? 1800 : 60;

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

  const offset = (page - 1) * limit;

  const supabase =
    (supabaseAdmin as unknown as typeof supabaseAdmin | undefined) ??
    (supabaseServerPublic as unknown as typeof supabaseServerPublic | undefined);

  if (!supabase) {
    return NextResponse.json({
      articles: [],
      total_count: 0,
      current_page: 1,
      total_pages: 0,
      categories: [],
      has_next: false,
      has_prev: false,
    });
  }

  try {
    const payload = await cached(
      ['api', 'articles', page, limit, category ?? 'all', search ?? '', sortBy, sortOrder],
      async () => {
        let query = supabase
          .from('articles')
          .select(
            `
              id,
              title,
              created_at,
              view_count,
              author_id,
              category_id,
              categories (
                id,
                name
              ),
              users_public_view:author_id (
                nickname
              ),
              latest_approved_version:article_versions_public_view!inner (
                id,
                content,
                created_at,
                status,
                editor_id,
                users_public_view:editor_id (
                  nickname
                )
              )
            `
          )
          .eq('article_versions_public_view.status', 'approved')
          .order(sortBy, { ascending: sortOrder === 'asc' })
          .range(offset, offset + limit - 1);

        if (category && category !== 'all') {
          query = query.eq('category_id', category);
        }

        if (search) {
          query = query.ilike('title', `%${search}%`);
        }

        const { data: articles, error: articlesError } = await query;

        if (articlesError) {
          console.error('Error fetching articles:', articlesError);
          throw new Error('Failed to fetch articles');
        }

        let countQuery = supabase
          .from('articles')
          .select('id, article_versions_public_view!inner(id)', { count: 'exact', head: true })
          .eq('article_versions_public_view.status', 'approved');

        if (category && category !== 'all') {
          countQuery = countQuery.eq('category_id', category);
        }

        if (search) {
          countQuery = countQuery.ilike('title', `%${search}%`);
        }

        const { count, error: countError } = await countQuery;
        if (countError) {
          console.error('Error counting articles:', countError);
        }

        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
        }

        return {
          articles: articles || [],
          total_count: count || 0,
          current_page: page,
          total_pages: Math.ceil((count || 0) / limit),
          categories: categories || [],
          has_next: offset + limit < (count || 0),
          has_prev: page > 1,
        };
      },
      {
        revalidate: REVALIDATE_SECONDS,
        tags: [CACHE_TAGS.articles, CACHE_TAGS.categories],
      }
    );

    return NextResponse.json(payload);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
