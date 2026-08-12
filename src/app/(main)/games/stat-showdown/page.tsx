import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';
import { ClockIcon, TargetIcon } from '@/components/icons/CommonIcons';

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
    icon: <TargetIcon className='h-10 w-10' />,
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
    icon: <ClockIcon className='h-10 w-10' />,
  },
];

export default function StatShowdownHubPage() {
  return (
    <PageShell width='wide' className='space-y-2 md:space-y-8 dark:text-slate-200'>
      <PageHeader title='能力对决' description={DESCRIPTION} className='mb-4 md:mb-8' />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {MODES.map((m) => (
          <Link
            key={m.id}
            href={m.href}
            className='border-border bg-surface group flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:hover:border-blue-500'
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
    </PageShell>
  );
}
