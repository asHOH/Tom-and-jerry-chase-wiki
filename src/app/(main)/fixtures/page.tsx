import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';

import FixtureClient from './FixtureGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '功能各异的地图组件——地图的基础组成部分';

export const metadata: Metadata = generatePageMetadata({
  title: '地图组件',
  description: DESCRIPTION,
  keywords: ['地图组件'],
  canonicalUrl: 'https://tjwiki.com/fixtures',
});

export default function FixturesPage() {
  return <FixtureClient description={DESCRIPTION} />;
}
