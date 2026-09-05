import type { Metadata } from 'next';

import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { resolveSupabaseSecretKey } from '@/lib/supabase/config';
import { SITE_NAME } from '@/constants/brand';
import { getSiteJsonLd } from '@/constants/seo';
import StructuredData from '@/components/StructuredData';
import { env } from '@/env';

import HomeContentClient from './HomeClient';

const DESCRIPTION = '非官方玩家资料站，查询猫和老鼠手游的角色、道具、知识卡等信息。';

export const dynamic = 'force-static';
export const metadata: Metadata = generatePageMetadata({
  title: SITE_NAME,
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
        hasServiceKey={!!resolveSupabaseSecretKey(env)}
      />
    </>
  );
}
