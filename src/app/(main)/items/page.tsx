import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';

import ItemClient from './ItemGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '在地图中散落的各式各样的道具——猫鼠相互对抗的关键机制';

export const metadata: Metadata = generatePageMetadata({
  title: '道具',
  description: DESCRIPTION,
  keywords: ['道具'],
  canonicalUrl: 'https://tjwiki.com/items',
});

export default function ItemsPage() {
  return <ItemClient description={DESCRIPTION} />;
}
