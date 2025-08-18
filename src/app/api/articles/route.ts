import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const offset = (page - 1) * limit;

  try {
    let query = supabaseAdmin
      .from('articles')
      .select(
        `
        id,
        title,
        created_at,
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

    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    // Apply search filter
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: articles, error: articlesError } = await query;

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('articles')
      .select('id', { count: 'exact', head: true })
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

    // Get categories for filter options
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .order('name');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    }

    return NextResponse.json({
      articles: articles || [],
      total_count: count || 0,
      current_page: page,
      total_pages: Math.ceil((count || 0) / limit),
      categories: categories || [],
      has_next: offset + limit < (count || 0),
      has_prev: page > 1,
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
