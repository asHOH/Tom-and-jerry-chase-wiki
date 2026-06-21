import type { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import GameClient from './GameClient';

export const dynamic = 'force-static';

const DESCRIPTION = '通过回答游戏情境问题，找到最适合你的猫/鼠角色';

export const metadata: Metadata = generatePageMetadata({
  title: '人格测试',
  description: DESCRIPTION,
  keywords: ['人格测试', '角色匹配', '猫和老鼠', '猫鼠人格测试'],
  canonicalUrl: `${SITE_URL}/games/playstyle-quiz`,
});

export default function PlaystyleQuizPage() {
  return <GameClient description={DESCRIPTION} />;
}
