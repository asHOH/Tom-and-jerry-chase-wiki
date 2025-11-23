import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';

import ItemGroupClient from './ItemGroupGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '列举目前支持的所有组合';

export const metadata: Metadata = generatePageMetadata({
  title: '组合',
  description: DESCRIPTION,
  keywords: ['组合'],
  canonicalUrl: 'https://tjwiki.com/itemGroups',
});

export default function ItemGroupsPage() {
  return <ItemGroupClient description={DESCRIPTION} />;
}
