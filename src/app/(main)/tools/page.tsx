import { Metadata } from 'next';
import ToolGridClient from './ToolGridClient';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

const DESCRIPTION = '集成部分快捷工具，便于筛选和查看信息';

export const metadata: Metadata = generatePageMetadata({
  title: '工具栏',
  description: DESCRIPTION,
  keywords: ['工具栏'],
  canonicalUrl: 'https://tjwiki.com/tools',
});

export default function ToolPage() {
  return <ToolGridClient description={DESCRIPTION} />;
}
