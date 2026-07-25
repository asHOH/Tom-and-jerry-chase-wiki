import 'server-only';

import { SITE_NAME, SITE_URL } from '@/constants/seo';

export type WikiEmailTone = 'danger' | 'info' | 'success' | 'warning';

type WikiEmailTemplateInput = {
  preheader: string;
  eyebrow?: string;
  title: string;
  message: string;
  tone?: WikiEmailTone;
  action?: { label: string; url: string };
  contentHtml?: string;
  notice?: string;
  unsubscribeUrl?: string;
};

const toneStyles: Record<
  WikiEmailTone,
  { accent: string; background: string; foreground: string; symbol: string }
> = {
  danger: {
    accent: '#dc2626',
    background: '#fef2f2',
    foreground: '#991b1b',
    symbol: '!',
  },
  info: {
    accent: '#2563eb',
    background: '#eff6ff',
    foreground: '#1d4ed8',
    symbol: 'i',
  },
  success: {
    accent: '#059669',
    background: '#ecfdf5',
    foreground: '#047857',
    symbol: '✓',
  },
  warning: {
    accent: '#d97706',
    background: '#fffbeb',
    foreground: '#b45309',
    symbol: '!',
  },
};

export const escapeEmailHtml = (value: string) =>
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

const textToHtml = (value: string) => escapeEmailHtml(value).replace(/\n/g, '<br>');

export const renderWikiEmailDetails = (rows: ReadonlyArray<{ label: string; value: string }>) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
    ${rows
      .map(
        ({ label, value }, index) => `
          <tr>
            <td style="width:108px;padding:13px 16px;color:#64748b;font-size:13px;font-weight:600;vertical-align:top;${index > 0 ? 'border-top:1px solid #e2e8f0;' : ''}">${escapeEmailHtml(label)}</td>
            <td style="padding:13px 16px;color:#1e293b;font-size:14px;line-height:1.6;word-break:break-word;${index > 0 ? 'border-top:1px solid #e2e8f0;' : ''}">${textToHtml(value)}</td>
          </tr>`
      )
      .join('')}
  </table>`;

export const renderWikiEmailCallout = (content: string) => `
  <div style="margin-top:18px;padding:16px 18px;background:#f8fafc;border-left:4px solid #3b82f6;border-radius:4px 12px 12px 4px;color:#334155;font-size:14px;line-height:1.7;word-break:break-word;">
    ${textToHtml(content)}
  </div>`;

export const renderWikiEmailTemplate = ({
  preheader,
  eyebrow = '猫鼠 Wiki 通知',
  title,
  message,
  tone = 'info',
  action,
  contentHtml,
  notice,
  unsubscribeUrl,
}: WikiEmailTemplateInput): string => {
  const colors = toneStyles[tone];
  const logoUrl = new URL('/icon.png', SITE_URL).toString();
  const homeUrl = new URL('/', SITE_URL).toString();
  const concisePreheader = preheader.slice(0, 180);

  return `<!doctype html>
<html lang="zh-CN" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light">
    <title>${escapeEmailHtml(title)}</title>
    <style>
      @media only screen and (max-width:620px) {
        .email-shell { width:100% !important; border-radius:0 !important; }
        .email-padding { padding-left:24px !important; padding-right:24px !important; }
        .email-title { font-size:25px !important; line-height:1.25 !important; }
        .email-button { display:block !important; text-align:center !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#eef2f7;color:#1e293b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeEmailHtml(concisePreheader)}&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#eef2f7;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-shell" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #dbe3ed;border-radius:20px;box-shadow:0 12px 32px rgba(15,23,42,.08);overflow:hidden;border-collapse:separate;border-spacing:0;">
            <tr>
              <td style="height:6px;background:linear-gradient(90deg,#2563eb 0%,#7c3aed 50%,${colors.accent} 100%);font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td class="email-padding" style="padding:28px 40px 22px;border-bottom:1px solid #edf2f7;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="52" style="width:52px;vertical-align:middle;">
                      <img src="${escapeEmailHtml(logoUrl)}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border:0;border-radius:12px;">
                    </td>
                    <td style="padding-left:14px;vertical-align:middle;">
                      <a href="${escapeEmailHtml(homeUrl)}" style="color:#0f172a;text-decoration:none;font-size:18px;font-weight:800;letter-spacing:.2px;">${escapeEmailHtml(SITE_NAME)}</a>
                      <div style="margin-top:3px;color:#64748b;font-size:12px;letter-spacing:.8px;">TOM AND JERRY CHASE WIKI</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-padding" style="padding:38px 40px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:42px;height:42px;border-radius:13px;background:${colors.background};color:${colors.foreground};font-size:22px;font-weight:800;text-align:center;vertical-align:middle;">${colors.symbol}</td>
                    <td style="padding-left:13px;color:${colors.foreground};font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;vertical-align:middle;">${escapeEmailHtml(eyebrow)}</td>
                  </tr>
                </table>
                <h1 class="email-title" style="margin:22px 0 14px;color:#0f172a;font-size:30px;line-height:1.3;font-weight:800;letter-spacing:-.4px;">${escapeEmailHtml(title)}</h1>
                <p style="margin:0;color:#475569;font-size:16px;line-height:1.8;">${textToHtml(message)}</p>
                ${contentHtml ? `<div style="margin-top:24px;">${contentHtml}</div>` : ''}
                ${
                  action
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td style="border-radius:10px;background:${colors.accent};"><a class="email-button" href="${escapeEmailHtml(action.url)}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;border-radius:10px;">${escapeEmailHtml(action.label)} &nbsp;→</a></td></tr></table>`
                    : ''
                }
                ${notice ? `<p style="margin:24px 0 0;padding:13px 15px;background:#f8fafc;border-radius:10px;color:#64748b;font-size:13px;line-height:1.6;">${textToHtml(notice)}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td class="email-padding" style="padding:22px 40px 26px;background:#f8fafc;border-top:1px solid #edf2f7;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7;">这是一封由 ${escapeEmailHtml(SITE_NAME)} 自动发送的邮件，请勿直接回复。</p>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;line-height:1.7;">
                  <a href="${escapeEmailHtml(homeUrl)}" style="color:#64748b;text-decoration:underline;">访问 Wiki</a>
                  ${unsubscribeUrl ? `&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${escapeEmailHtml(unsubscribeUrl)}" style="color:#64748b;text-decoration:underline;">取消订阅通知邮件</a>` : ''}
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;color:#94a3b8;font-size:11px;">© ${new Date().getFullYear()} ${escapeEmailHtml(SITE_NAME)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
