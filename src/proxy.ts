import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  // Block Baidu Browser (Android) by UA, allow force continue
  const ua = request.headers.get('user-agent')?.toLowerCase() || '';
  const isBaiduAndroid =
    ua.includes('baidubrowser') ||
    ua.includes('bdbrowser') ||
    (ua.includes('baidu') && ua.includes('android'));
  const url = new URL(request.url);
  const forceContinue =
    url.searchParams.get('force_continue') === '1' ||
    request.cookies.get('force_continue')?.value === '1';

  if (isBaiduAndroid && !forceContinue) {
    const html = `
      <!DOCTYPE html>
      <html lang="zh">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>浏览器不受支持</title>
        <style>
          body { font-family: sans-serif; background: #fff; color: #222; padding: 2em; }
          .container { max-width: 400px; margin: 3em auto; border: 1px solid #eee; border-radius: 8px; padding: 2em; background: #fafafa; }
          a { color: #1976d2; text-decoration: underline; }
          .btn { display: inline-block; margin-top: 1.5em; padding: 0.5em 1.5em; background: #1976d2; color: #fff; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>检测到您正在使用百度浏览器（Android）</h2>
          <p>本站不支持百度浏览器。请使用以下浏览器访问：</p>
          <ul>
            <li><a href="https://www.google.cn/chrome/" target="_blank">Chrome 浏览器</a></li>
            <li><a href="https://www.firefox.com/zh-CN/browsers/mobile/android/" target="_blank">Firefox 浏览器</a></li>
          </ul>
          <a class="btn" href="?force_continue=1" onclick="document.cookie='force_continue=1;path=/';location.search='?force_continue=1';return false;">强制继续访问</a>
        </div>
      </body>
      </html>
    `;
    return new NextResponse(html, {
      status: 403,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  // If force_continue param is set, set cookie for future requests
  if (url.searchParams.get('force_continue') === '1') {
    const res = NextResponse.next();
    res.cookies.set('force_continue', '1', { path: '/' });
    return res;
  }

  // Now, run the Supabase session update logic
  const supabaseResponse = await updateSession(request);

  // Return the response from Supabase middleware, which includes updated cookies
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any file with a common image extension
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
