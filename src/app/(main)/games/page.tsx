import type { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import HomePageSection from '@/components/ui/NavSection';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';

export const dynamic = 'force-static';

const DESCRIPTION = '猫和老鼠手游数据小游戏 - 猜角色、能力对决、人格测试';

export const metadata: Metadata = generatePageMetadata({
  title: '小游戏',
  description: DESCRIPTION,
  keywords: ['小游戏', '猜角色', '能力对决', '人格测试', '猫和老鼠'],
  canonicalUrl: `${SITE_URL}/games`,
});

const GAME_BUTTONS = [
  {
    imageSrc: '/images/icons/game.png',
    imageAlt: '',
    title: '猜角色',
    description: '每日挑战 — 根据线索找出当天的神秘角色',
    href: '/games/guess-character/',
    ariaLabel: '猜角色每日挑战',
  },
  {
    imageSrc: '/images/icons/game.png',
    imageAlt: '',
    title: '能力对决',
    description: '比较角色属性 — 选择数值更高的角色',
    href: '/games/stat-showdown/',
    ariaLabel: '能力对决',
  },
  {
    imageSrc: '/images/icons/game.png',
    imageAlt: '',
    title: '人格测试',
    description: '回答情境问题 — 找到最适合你的角色',
    href: '/games/playstyle-quiz/',
    ariaLabel: '人格测试',
  },
];

export default function GamesPage() {
  return (
    <div className='mx-auto max-w-3xl space-y-2 p-2 md:max-w-6xl md:space-y-8 md:p-6 dark:text-slate-200'>
      <header className='mb-4 space-y-2 px-2 text-center md:mb-8 md:space-y-4 md:px-4'>
        <PageTitle>小游戏</PageTitle>
        <PageDescription>{DESCRIPTION}</PageDescription>
      </header>

      <HomePageSection title='游戏列表' buttons={GAME_BUTTONS} />
    </div>
  );
}
