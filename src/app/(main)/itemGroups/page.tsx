import { Metadata } from 'next';
import ItemGroupClient from './ItemGroupGridClient';
import { generatePageMetadata } from '@/lib/metadataUtils';

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
