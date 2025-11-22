import { Metadata } from 'next';
import SpecialSkillAdviceClient from './SpecialSkillAdviceClient';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '特技推荐',
  description: '列出常用特技及特技克制关系，便于新手进行选择',
  keywords: ['特技'],
  canonicalUrl: 'https://tjwiki.com/special-skills/advice',
});

export default function SpecialSkillsPage() {
  return <SpecialSkillAdviceClient />;
}
