import type { Metadata } from 'next';

import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { getSiteJsonLd } from '@/constants/seo';
import StructuredData from '@/components/StructuredData';
import { env } from '@/env';

import HomeContentClient from './HomeClient';

const DESCRIPTION = '查询猫和老鼠手游的角色、道具、知识卡等信息。';

export const dynamic = 'force-static';
export const metadata: Metadata = generatePageMetadata({
  title: '猫和老鼠手游wiki',
  description: DESCRIPTION,
  canonicalUrl: getCanonicalUrl('/'),
  absoluteTitle: true,
});

export default function Home() {
  return (
    <>
      <StructuredData data={getSiteJsonLd()} />
      <HomeContentClient
        description={DESCRIPTION}
        hasServiceKey={!!env.SUPABASE_SERVICE_ROLE_KEY}
      />
    </>
  );
}
