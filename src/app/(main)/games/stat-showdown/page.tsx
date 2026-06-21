import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';

export const dynamic = 'force-static';

const DESCRIPTION = '能力对决 — 比较角色属性，选择数值更高（或更低）的角色，挑战最高得分！';

export const metadata: Metadata = generatePageMetadata({
  title: '能力对决',
  description: DESCRIPTION,
  keywords: ['能力对决', '角色属性', '猫和老鼠', 'High Low'],
  canonicalUrl: `${SITE_URL}/games/stat-showdown`,
});

const MODES = [
  {
    id: 'all',
    label: '全部角色',
    desc: '60 名角色 · 4 项属性',
    href: '/games/stat-showdown/all/',
    icon: (
      <svg
        className='h-10 w-10'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.5}
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'
        />
        <path strokeLinecap='round' strokeLinejoin='round' d='M12 18a6 6 0 100-12 6 6 0 000 12z' />
        <path strokeLinecap='round' strokeLinejoin='round' d='M12 14a2 2 0 100-4 2 2 0 000 4z' />
      </svg>
    ),
  },
  {
    id: 'cats',
    label: '猫阵营',
    desc: '21 只猫 · 5 项属性',
    href: '/games/stat-showdown/cats/',
    icon: (
      <Image
        src='/images/icons/cat-faction.png'
        alt=''
        width={40}
        height={40}
        className='object-contain'
      />
    ),
  },
  {
    id: 'mice',
    label: '鼠阵营',
    desc: '39 只鼠 · 6 项属性',
    href: '/games/stat-showdown/mice/',
    icon: (
      <Image
        src='/images/icons/mouse-faction.png'
        alt=''
        width={40}
        height={40}
        className='object-contain'
      />
    ),
  },
  {
    id: 'blitz',
    label: '限时挑战',
    desc: '30 秒冲刺 · 4 项属性',
    href: '/games/stat-showdown/blitz/',
    icon: (
      <svg
        className='h-10 w-10'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.5}
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
        />
      </svg>
    ),
  },
];

export default function StatShowdownHubPage() {
  return (
    <div className='mx-auto max-w-3xl space-y-2 p-2 md:max-w-6xl md:space-y-8 md:p-6 dark:text-slate-200'>
      <header className='mb-4 space-y-2 px-2 text-center md:mb-8 md:space-y-4 md:px-4'>
        <PageTitle>能力对决</PageTitle>
        <PageDescription>{DESCRIPTION}</PageDescription>
      </header>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {MODES.map((m) => (
          <Link
            key={m.id}
            href={m.href}
            className='group flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500'
          >
            <span className='text-gray-700 transition-colors group-hover:text-blue-500 dark:text-gray-300 dark:group-hover:text-blue-400'>
              {m.icon}
            </span>
            <span className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
              {m.label}
            </span>
            <span className='text-sm text-gray-500 dark:text-gray-400'>{m.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
