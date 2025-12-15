import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';

import MapClient from './MapGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '地图界面（建设中）';

export const metadata: Metadata = generatePageMetadata({
  title: '地图',
  description: DESCRIPTION,
  keywords: ['地图'],
  canonicalUrl: 'https://tjwiki.com/maps',
});

export default function ItemsPage() {
  return <MapClient description={DESCRIPTION} />;
}
