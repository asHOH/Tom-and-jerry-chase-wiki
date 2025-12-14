import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { CharacterRankingGrid } from '@/features/characters/components';
import { RankableProperty } from '@/features/characters/utils/ranking';

export const dynamic = 'force-static';

const DESCRIPTION = '查看所有角色在某项属性上的排名';
const DEFAULT_PROPERTY: RankableProperty = 'maxHp';

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
    <div className='mx-auto max-w-7xl space-y-6 p-6'>
      <CharacterRankingGrid description={DESCRIPTION} initialProperty={DEFAULT_PROPERTY} />
    </div>
  );
}
