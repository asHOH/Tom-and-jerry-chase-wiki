import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';

export async function GET() {
  const guard = await requireRole(['Coordinator', 'Reviewer']);
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { data, error } = await supabase.rpc('get_categories');
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['Coordinator', 'Reviewer']);
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { name, parent_category_id, default_visibility } = await request.json();
  if (!name || !default_visibility) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await supabase.rpc('create_category', {
    _name: name,
    _parent_category_id: parent_category_id ?? null,
    _default_visibility: default_visibility,
  });
  if (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function PUT(request: NextRequest) {
  const guard = await requireRole(['Coordinator', 'Reviewer']);
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { id, name, parent_category_id, default_visibility } = await request.json();
  if (!id || !name || !default_visibility) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await supabase.rpc('update_category', {
    _id: id,
    _name: name,
    _parent_category_id: parent_category_id ?? null,
    _default_visibility: default_visibility,
  });
  if (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireRole(['Coordinator', 'Reviewer']);
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await supabase.rpc('delete_category', { _id: id });
  if (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
