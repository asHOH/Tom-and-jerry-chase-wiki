import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';

import ModeClient from './ModeGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '收录当前已上线的全部游戏模式';

export const metadata: Metadata = generatePageMetadata({
  title: '游戏模式',
  description: DESCRIPTION,
  keywords: ['游戏模式'],
  canonicalUrl: 'https://tjwiki.com/modes',
});

export default function ModesPage() {
  return <ModeClient description={DESCRIPTION} />;
}
