import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import { getRequestIp } from '@/lib/blocks/server';
import { CACHE_TAGS } from '@/lib/cacheTags';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';

export async function GET() {
  const guard = await requirePermission(['category.create', 'category.update', 'category.delete']);
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { data, error } = await supabase.rpc('get_categories');
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, parent_category_id, default_visibility } = body;
  const guard = await requirePermission(
    'category.create',
    parent_category_id ? { resourceType: 'categories', resourceId: parent_category_id } : undefined,
    'all',
    { request, blockAction: 'edit' }
  );
  if ('error' in guard) return guard.error;
  if (!name || !default_visibility) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await requireSupabaseAdminClient().rpc('prepared_create_category', {
    p_actor_id: guard.userId,
    p_ip: getRequestIp(request),
    p_name: name,
    p_parent_category_id: parent_category_id ?? null,
    p_default_visibility: default_visibility,
  });
  if (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }

  revalidateTag(CACHE_TAGS.categories, 'max');
  revalidateTag(CACHE_TAGS.articles, 'max');
  return NextResponse.json({ ok: true });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, parent_category_id, default_visibility } = body;
  const contexts = [id, parent_category_id]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map((resourceId) => ({ resourceType: 'categories', resourceId }));
  const guard = await requirePermission('category.update', contexts, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in guard) return guard.error;
  if (!id || !name || !default_visibility) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await requireSupabaseAdminClient().rpc('prepared_update_category', {
    p_actor_id: guard.userId,
    p_ip: getRequestIp(request),
    p_id: id,
    p_name: name,
    p_parent_category_id: parent_category_id ?? null,
    p_default_visibility: default_visibility,
  });
  if (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }

  revalidateTag(CACHE_TAGS.categories, 'max');
  revalidateTag(CACHE_TAGS.articles, 'max');
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id } = body;
  const guard = await requirePermission(
    'category.delete',
    id ? { resourceType: 'categories', resourceId: id } : undefined,
    'all',
    { request, blockAction: 'edit' }
  );
  if ('error' in guard) return guard.error;
  if (!id) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await requireSupabaseAdminClient().rpc('prepared_delete_category', {
    p_actor_id: guard.userId,
    p_ip: getRequestIp(request),
    p_id: id,
  });
  if (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }

  revalidateTag(CACHE_TAGS.categories, 'max');
  revalidateTag(CACHE_TAGS.articles, 'max');
  return NextResponse.json({ ok: true });
}
