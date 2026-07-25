import {
  renderWikiEmailCallout,
  renderWikiEmailDetails,
  renderWikiEmailTemplate,
} from '@/lib/emailTemplate';

jest.mock('@/constants/seo', () => ({
  SITE_NAME: '猫鼠 Wiki',
  SITE_URL: 'https://tjwiki.test',
}));

describe('emailTemplate', () => {
  it('renders a branded responsive email with an action and unsubscribe link', () => {
    const html = renderWikiEmailTemplate({
      preheader: '审核结果通知',
      eyebrow: '审核通过',
      title: '文章已发布',
      message: '您的文章已经通过审核。',
      tone: 'success',
      action: { label: '查看详情', url: 'https://tjwiki.test/articles/1/' },
      unsubscribeUrl: 'https://tjwiki.test/unsubscribe?token=abc',
    });

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('TOM AND JERRY CHASE WIKI');
    expect(html).toContain('@media only screen and (max-width:620px)');
    expect(html).toContain('https://tjwiki.test/icon.png');
    expect(html).toContain('查看详情');
    expect(html).toContain('取消订阅通知邮件');
  });

  it('escapes untrusted text in messages, details, and callouts', () => {
    const unsafe = '<img src=x onerror="alert(1)">';
    const contentHtml = `${renderWikiEmailDetails([{ label: '内容', value: unsafe }])}${renderWikiEmailCallout(unsafe)}`;
    const html = renderWikiEmailTemplate({
      preheader: unsafe,
      title: unsafe,
      message: unsafe,
      contentHtml,
    });

    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });
});
