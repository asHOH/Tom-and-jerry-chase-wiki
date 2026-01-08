import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import KnowledgeCardClient from './KnowledgeCardClient';

export const dynamic = 'force-static';

const DESCRIPTION = '提升猫击倒、放飞老鼠的能力与老鼠生存、救援和推奶酪的能力';

export const metadata: Metadata = generatePageMetadata({
  title: '知识卡',
  description: DESCRIPTION,
  keywords: ['知识卡'],
  canonicalUrl: `${SITE_URL}/cards`,
});

export default function CardsPage() {
  return <KnowledgeCardClient description={DESCRIPTION} />;
}
