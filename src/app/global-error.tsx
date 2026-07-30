'use client';

import { useEffect } from 'react';
import Link from 'next/link';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
};

export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang='zh-CN'>
      <body>
        <main className='global-error-page'>
          <section className='global-error-card' aria-labelledby='global-error-title'>
            <div className='global-error-icon' aria-hidden='true'>
              !
            </div>
            <h1 id='global-error-title'>页面加载失败</h1>
            <p>页面遇到了意外错误。您可以重试，或返回首页继续浏览。</p>
            <div className='global-error-actions'>
              <button type='button' onClick={retry}>
                重新加载
              </button>
              <Link href='/'>返回首页</Link>
            </div>
          </section>
        </main>
        <style>{`
          :root {
            color-scheme: light dark;
            font-family:
              Inter, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
          }

          .global-error-page {
            display: grid;
            min-height: 100dvh;
            place-items: center;
            padding: 1.5rem;
            color: #111827;
            background: #f3f4f6;
          }

          .global-error-card {
            width: min(100%, 28rem);
            padding: 2rem;
            text-align: center;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            box-shadow: 0 10px 25px rgb(15 23 42 / 10%);
          }

          .global-error-icon {
            display: grid;
            width: 4rem;
            height: 4rem;
            margin: 0 auto 1rem;
            place-items: center;
            color: #dc2626;
            font-size: 2rem;
            font-weight: 700;
            background: #fee2e2;
            border-radius: 9999px;
          }

          h1 {
            margin: 0;
            color: #111827;
            font-size: 1.5rem;
            line-height: 2rem;
          }

          p {
            margin: 0.75rem 0 0;
            color: #4b5563;
            line-height: 1.625;
          }

          .global-error-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.75rem;
            margin-top: 1.5rem;
          }

          button,
          a {
            display: inline-flex;
            min-height: 2.75rem;
            align-items: center;
            justify-content: center;
            padding: 0.625rem 1rem;
            color: #ffffff;
            font: inherit;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            background: #2563eb;
            border: 0;
            border-radius: 0.5rem;
            transition: background-color 150ms ease;
          }

          button:hover {
            background: #1d4ed8;
          }

          a {
            color: #1f2937;
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
          }

          a:hover {
            background: #e5e7eb;
          }

          button:focus-visible,
          a:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          @media (prefers-color-scheme: dark) {
            .global-error-page {
              color: #f1f5f9;
              background: #0f172a;
            }

            .global-error-card {
              background: #1e293b;
              border-color: #334155;
              box-shadow: 0 10px 25px rgb(0 0 0 / 30%);
            }

            .global-error-icon {
              color: #fca5a5;
              background: rgb(127 29 29 / 45%);
            }

            h1 {
              color: #f1f5f9;
            }

            p {
              color: #cbd5e1;
            }

            button {
              background: #1d4ed8;
            }

            button:hover {
              background: #2563eb;
            }

            a {
              color: #f1f5f9;
              background: #334155;
              border-color: #475569;
            }

            a:hover {
              background: #475569;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            button,
            a {
              transition: none;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
