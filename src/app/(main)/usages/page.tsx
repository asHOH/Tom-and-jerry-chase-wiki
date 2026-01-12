import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import UsagesClient from './UsagesClient';

export const dynamic = 'force-static';

const DESCRIPTION = '介绍本网站的功能及查阅方法';

export const metadata: Metadata = generatePageMetadata({
  title: '使用指南',
  description: DESCRIPTION,
  keywords: ['使用指南'],
  canonicalUrl: `${SITE_URL}/usages`,
});

export default function ToolPage() {
  return <UsagesClient description={DESCRIPTION} />;
}
