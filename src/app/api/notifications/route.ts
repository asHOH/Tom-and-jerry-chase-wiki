import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const filter = request.nextUrl.searchParams.get('filter') === 'unread' ? 'unread' : 'all';
  const cursor = request.nextUrl.searchParams.get('cursor');

  let query = supabase
    .from('notifications')
    .select('id, kind, title, body, href, source_ids, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (filter === 'unread') query = query.is('read_at', null);
  if (cursor) query = query.lt('created_at', cursor);

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    query,
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null),
  ]);

  if (error || countError) {
    console.error('Failed to load notifications:', error ?? countError);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const notifications = (data ?? []).slice(0, PAGE_SIZE);

  return NextResponse.json({
    notifications,
    unreadCount: count ?? 0,
    nextCursor: hasMore ? (notifications.at(-1)?.created_at ?? null) : null,
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    notificationId?: unknown;
    markAll?: unknown;
  } | null;
  const now = new Date().toISOString();

  let query = supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('user_id', userId)
    .is('read_at', null);

  if (body?.markAll !== true) {
    if (typeof body?.notificationId !== 'string' || !body.notificationId) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    query = query.eq('id', body.notificationId);
  }

  const { error } = await query;
  if (error) {
    console.error('Failed to mark notifications read:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
