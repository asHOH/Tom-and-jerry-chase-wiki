import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import ToolGridClient from './ToolGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '集成部分快捷工具，便于筛选和查看信息';

export const metadata: Metadata = generatePageMetadata({
  title: '工具栏',
  description: DESCRIPTION,
  keywords: ['工具栏'],
  canonicalUrl: `${SITE_URL}/tools`,
});

export default function ToolPage() {
  return <ToolGridClient description={DESCRIPTION} />;
}
