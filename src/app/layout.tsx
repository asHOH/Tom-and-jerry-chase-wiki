import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '猫和老鼠手游wiki',
  description: '猫和老鼠手游wiki。本网站为粉丝制作，仅供学习交流使用，并非官方网站，素材版权均归网易猫和老鼠手游所有。特别感谢b站up主梦回_淦德蒸蚌、是莫莫喵提供的测试数据。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-100 relative">
          {children}
        </main>
      </body>
    </html>
  );
}
