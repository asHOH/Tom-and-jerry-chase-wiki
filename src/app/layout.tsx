import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DISCLAIMER_TEXT } from '@/constants';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '猫和老鼠手游wiki',
  description: `猫和老鼠手游wiki。${DISCLAIMER_TEXT}`,
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
