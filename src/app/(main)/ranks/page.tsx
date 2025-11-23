import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { CharacterRankingGrid } from '@/components/displays/characters';

export const dynamic = 'force-static';

const DESCRIPTION = '查看所有角色在某项属性上的排名';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: '角色属性排行榜',
    description: DESCRIPTION,
    keywords: ['角色排行榜', '属性', '排名'],
    canonicalUrl: 'https://tjwiki.com/ranks',
  });
}

export default function RanksPage() {
  return (
    <div className='mx-auto max-w-7xl space-y-6 p-6' style={{ paddingTop: '80px' }}>
      <CharacterRankingGrid description={DESCRIPTION} />
    </div>
  );
}
