import { NextRequest, NextResponse } from 'next/server';

import {
  createNotificationUnsubscribeToken,
  getNotificationUnsubscribeUserId,
} from '@/lib/notificationUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[character] ?? character;
  });

const htmlResponse = (title: string, message: string, form?: string, status = 200) =>
  new NextResponse(
    `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head><body style="font-family:system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 20px;color:#1e293b"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>${form ?? ''}</body></html>`,
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/html; charset=utf-8',
        'Referrer-Policy': 'no-referrer',
      },
    }
  );

const loadSettingsForToken = async (token: string) => {
  const userId = getNotificationUnsubscribeUserId(token);
  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from('notification_email_settings')
    .select('email, email_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.email) return null;

  const expectedToken = createNotificationUnsubscribeToken(userId, data.email);
  if (expectedToken !== token) return null;

  return { userId, enabled: data.email_enabled };
};

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return htmlResponse('链接无效', '取消订阅链接无效或已失效。', undefined, 400);

  const settings = await loadSettingsForToken(token);
  if (!settings) return htmlResponse('链接无效', '取消订阅链接无效或已失效。', undefined, 400);
  if (!settings.enabled) return htmlResponse('已取消订阅', '您已停止接收通知邮件。');

  const action = `/api/notifications/email/unsubscribe?token=${encodeURIComponent(token)}`;
  const form = `<form method="post" action="${escapeHtml(action)}"><button type="submit" style="border:0;border-radius:8px;background:#dc2626;color:white;padding:10px 16px;font-weight:600;cursor:pointer">确认取消订阅</button></form>`;
  return htmlResponse('取消订阅通知邮件', '确认后将不再通过邮件接收通知。', form);
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return htmlResponse('链接无效', '取消订阅链接无效或已失效。', undefined, 400);

  const settings = await loadSettingsForToken(token);
  if (!settings) return htmlResponse('链接无效', '取消订阅链接无效或已失效。', undefined, 400);

  if (settings.enabled) {
    const { error } = await supabaseAdmin
      .from('notification_email_settings')
      .update({ email_enabled: false, updated_at: new Date().toISOString() })
      .eq('user_id', settings.userId);
    if (error) return htmlResponse('操作失败', '暂时无法取消订阅，请稍后重试。', undefined, 500);
  }

  return htmlResponse('已取消订阅', '您已停止接收通知邮件。');
}
