import { Metadata } from 'next';
import BuffClient from './BuffGridClient';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

const DESCRIPTION = '游戏内的全部状态和效果（该页面建设调整中，非最终版本）';

export const metadata: Metadata = generatePageMetadata({
  title: '状态和效果',
  description: DESCRIPTION,
  keywords: ['状态', '效果', 'buffs', 'debuffs'],
  canonicalUrl: 'https://tjwiki.com/buffs',
});

export default function BuffsPage() {
  return <BuffClient description={DESCRIPTION} />;
}
