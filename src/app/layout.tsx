import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '猫和老鼠手游角色技能数据库',
  description: '猫和老鼠手游角色技能数据库，包含所有角色的技能信息、图片和视频',
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
