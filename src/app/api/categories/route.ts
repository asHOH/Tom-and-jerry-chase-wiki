import { NextRequest, NextResponse } from 'next/server';

import { resolveArticleCategoryPolicy } from '@/lib/articles/articleCategoryPolicy';
import { CACHE_TAGS } from '@/lib/cacheTags';
import { checkRateLimit } from '@/lib/rateLimit';
import { cached } from '@/lib/serverCache';
import { supabaseServerPublic } from '@/lib/supabase/public';

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, 'read', 'categories-list');
  if (!rl.allowed) {
    if ('headers' in rl) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rl.headers }
      );
    }
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const categories = await cached(
      ['api', 'categories'],
      async () => {
        const { data, error } = await supabaseServerPublic
          .from('categories')
          .select('id, name, parent_category_id, requires_character')
          .order('name');

        if (error) {
          console.error('Error fetching categories:', error);
          throw new Error('Failed to fetch categories');
        }
        const categoryRows = data ?? [];
        return categoryRows.map((category) => ({
          id: category.id,
          name: category.name,
          requires_character:
            resolveArticleCategoryPolicy(categoryRows, category.id)?.requiresCharacter ?? false,
        }));
      },
      {
        revalidate: 7200, // 2 hours
        tags: [CACHE_TAGS.categories],
      }
    );

    return NextResponse.json({ categories });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
