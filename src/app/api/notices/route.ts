import { NextResponse } from 'next/server';

import { sanitizeNoticeHTML } from '@/lib/notices/sanitize';
import type { PublicNotice } from '@/lib/notices/types';
import { supabaseServerPublic } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date().toISOString();
  const { data, error } = await supabaseServerPublic
    .from('site_notices')
    .select('id, title, content_html, starts_at, ends_at')
    .eq('is_published', true)
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('starts_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load active site notices:', error);
    return NextResponse.json({ error: 'Failed to load notices' }, { status: 500 });
  }

  const notices: PublicNotice[] = (data ?? []).map((notice) => ({
    id: notice.id,
    title: notice.title,
    contentHtml: sanitizeNoticeHTML(notice.content_html),
    startsAt: notice.starts_at,
    endsAt: notice.ends_at,
  }));

  return NextResponse.json({ notices }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
