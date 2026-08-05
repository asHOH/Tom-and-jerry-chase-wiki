import { NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import { noticePatchSchema, sanitizeNoticeInput } from '@/lib/notices/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RouteContext = { params: Promise<{ noticeId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const guard = await requirePermission('notice.manage', undefined, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in guard) return guard.error;

  const parsed = noticePatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const noticeId = (await params).noticeId;
  const updatedAt = new Date().toISOString();
  const update =
    parsed.data.operation === 'unpublish'
      ? { is_published: false, updated_by: guard.userId, updated_at: updatedAt }
      : (() => {
          const input = sanitizeNoticeInput(parsed.data);
          return input
            ? {
                title: input.title,
                content_html: input.contentHtml,
                starts_at: input.startsAt,
                ends_at: input.endsAt,
                is_published: true,
                updated_by: guard.userId,
                updated_at: updatedAt,
              }
            : null;
        })();

  if (!update) {
    return NextResponse.json({ error: 'Notice content is empty or too long' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('site_notices')
    .update(update)
    .eq('id', noticeId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Failed to update site notice:', error);
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const guard = await requirePermission('notice.manage', undefined, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in guard) return guard.error;

  const noticeId = (await params).noticeId;
  const { data: existing, error: readError } = await supabaseAdmin
    .from('site_notices')
    .select('is_published')
    .eq('id', noticeId)
    .maybeSingle();

  if (readError) {
    console.error('Failed to check site notice before deletion:', readError);
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 });
  }
  if (!existing) return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
  if (existing.is_published) {
    return NextResponse.json({ error: 'Unpublish the notice before deleting it' }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from('site_notices')
    .delete()
    .eq('id', noticeId)
    .eq('is_published', false)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Failed to delete site notice:', error);
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Notice changed; try again' }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
