import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import UsagesClient from './UsagesClient';

export const dynamic = 'force-static';

const DESCRIPTION = '本网站的使用指南';

export const metadata: Metadata = generatePageMetadata({
  title: '使用指南',
  description: DESCRIPTION,
  keywords: ['使用指南'],
  canonicalUrl: `${SITE_URL}/usages`,
});

export default function ToolPage() {
  return <UsagesClient description={DESCRIPTION} />;
}
