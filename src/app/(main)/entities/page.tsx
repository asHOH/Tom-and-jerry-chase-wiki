import { Metadata } from 'next';
import EntityClient from './EntityGridClient';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

const DESCRIPTION = '由角色技能或其它方式衍生出的独立物体，具有各自独特的作用';

export const metadata: Metadata = generatePageMetadata({
  title: '衍生物',
  description: DESCRIPTION,
  keywords: ['衍生物'],
  canonicalUrl: 'https://tjwiki.com/entities',
});

export default function EntitysPage() {
  return <EntityClient description={DESCRIPTION} />;
}
