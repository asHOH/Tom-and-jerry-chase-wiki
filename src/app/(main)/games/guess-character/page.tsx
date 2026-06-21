import type { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import GameClient from './GameClient';

export const dynamic = 'force-static';

const DESCRIPTION =
  '每日猜角色 — 根据阵营、定位标签、技能效果等线索，猜出当天的神秘角色。支持每日挑战和无限练习模式。';

export const metadata: Metadata = generatePageMetadata({
  title: '猜角色',
  description: DESCRIPTION,
  keywords: ['猜角色', '每日挑战', '猫和老鼠', '角色猜测', 'Wordle'],
  canonicalUrl: `${SITE_URL}/games/guess-character`,
});

export default function GuessCharacterPage() {
  return <GameClient description={DESCRIPTION} />;
}
