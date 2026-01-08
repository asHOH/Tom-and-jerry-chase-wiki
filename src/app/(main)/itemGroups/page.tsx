import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import ItemGroupClient from './ItemGroupGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '列举目前支持的所有组合';

export const metadata: Metadata = generatePageMetadata({
  title: '组合',
  description: DESCRIPTION,
  keywords: ['组合'],
  canonicalUrl: `${SITE_URL}/itemGroups`,
});

export default function ItemGroupsPage() {
  return <ItemGroupClient description={DESCRIPTION} />;
}
