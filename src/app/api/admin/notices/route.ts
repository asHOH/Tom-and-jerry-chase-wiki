import { NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import type { AdminNotice } from '@/lib/notices/types';
import { noticeMutationSchema, sanitizeNoticeInput } from '@/lib/notices/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const guard = await requirePermission('notice.manage');
  if ('error' in guard) return guard.error;

  const { data, error } = await supabaseAdmin
    .from('site_notices')
    .select(
      'id, title, content_html, is_published, starts_at, ends_at, created_by, updated_by, created_at, updated_at'
    )
    .order('starts_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load site notices for administration:', error);
    return NextResponse.json({ error: 'Failed to load notices' }, { status: 500 });
  }

  const userIds = [
    ...new Set((data ?? []).flatMap((notice) => [notice.created_by, notice.updated_by])),
  ];
  const { data: users, error: usersError } = userIds.length
    ? await supabaseAdmin.from('users').select('id, nickname').in('id', userIds)
    : { data: [], error: null };

  if (usersError) {
    console.error('Failed to load site notice managers:', usersError);
    return NextResponse.json({ error: 'Failed to load notice managers' }, { status: 500 });
  }

  const nicknameById = new Map((users ?? []).map((user) => [user.id, user.nickname]));
  const notices: AdminNotice[] = (data ?? []).map((notice) => ({
    id: notice.id,
    title: notice.title,
    contentHtml: notice.content_html,
    isPublished: notice.is_published,
    startsAt: notice.starts_at,
    endsAt: notice.ends_at,
    createdBy: notice.created_by,
    createdByNickname: nicknameById.get(notice.created_by) ?? null,
    updatedBy: notice.updated_by,
    updatedByNickname: nicknameById.get(notice.updated_by) ?? null,
    createdAt: notice.created_at,
    updatedAt: notice.updated_at,
  }));

  return NextResponse.json({ notices });
}

export async function POST(request: Request) {
  const guard = await requirePermission('notice.manage', undefined, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in guard) return guard.error;

  const parsed = noticeMutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const input = sanitizeNoticeInput(parsed.data);
  if (!input) {
    return NextResponse.json({ error: 'Notice content is empty or too long' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('site_notices')
    .insert({
      title: input.title,
      content_html: input.contentHtml,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      is_published: true,
      created_by: guard.userId,
      updated_by: guard.userId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create site notice:', error);
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
