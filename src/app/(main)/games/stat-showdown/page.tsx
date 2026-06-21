import type { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import GameClient from './GameClient';

export const dynamic = 'force-static';

const DESCRIPTION =
  '能力对决 — 比较角色属性，选择数值更高的角色。支持猫/鼠/全部角色模式及限时挑战。';

export const metadata: Metadata = generatePageMetadata({
  title: '能力对决',
  description: DESCRIPTION,
  keywords: ['能力对决', '角色属性', '猫和老鼠', 'High Low', '比较'],
  canonicalUrl: `${SITE_URL}/games/stat-showdown`,
});

export default function StatShowdownPage() {
  return <GameClient description={DESCRIPTION} />;
}
