import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import UsagesClient from './UsagesClient';

export const dynamic = 'force-static';

const DESCRIPTION = '详细介绍游戏内全部的局内机制';

export const metadata: Metadata = generatePageMetadata({
  title: '局内机制',
  description: DESCRIPTION,
  keywords: ['局内机制'],
  canonicalUrl: `${SITE_URL}/usages`,
});

export default function ToolPage() {
  return <UsagesClient description={DESCRIPTION} />;
}
