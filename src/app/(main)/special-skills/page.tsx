import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';

import SpecialSkillClient from './SpecialSkillGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '角色可配备的额外技能，合理使用将大幅提高角色能力';

export const metadata: Metadata = generatePageMetadata({
  title: '特技',
  description: DESCRIPTION,
  keywords: ['特技'],
  canonicalUrl: 'https://tjwiki.com/special-skills',
});

export default function SpecialSkillsPage() {
  return <SpecialSkillClient description={DESCRIPTION} />;
}
