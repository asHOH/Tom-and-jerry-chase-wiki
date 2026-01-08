import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import SpecialSkillClient from './SpecialSkillGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '角色可配备的额外技能，合理使用将大幅提高角色能力';

export const metadata: Metadata = generatePageMetadata({
  title: '特技',
  description: DESCRIPTION,
  keywords: ['特技'],
  canonicalUrl: `${SITE_URL}/special-skills`,
});

export default function SpecialSkillsPage() {
  return <SpecialSkillClient description={DESCRIPTION} />;
}
