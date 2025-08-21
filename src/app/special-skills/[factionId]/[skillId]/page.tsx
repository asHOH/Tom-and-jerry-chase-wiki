import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { specialSkills } from '@/data';
import type { FactionId } from '@/data/types';
import SpecialSkillDetailClient from './SpecialSkillDetailClient';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { generateArticleMetadata } from '@/lib/metadataUtils';

type CatSkill = (typeof specialSkills)['cat'][string];
type MouseSkill = (typeof specialSkills)['mouse'][string];

function getSkill(factionId: string, skillId: string): CatSkill | MouseSkill | undefined {
  if (factionId === 'cat') {
    const catSkills = specialSkills.cat as Record<string, CatSkill>;
    return Object.prototype.hasOwnProperty.call(catSkills, skillId)
      ? catSkills[skillId]
      : undefined;
  }
  if (factionId === 'mouse') {
    const mouseSkills = specialSkills.mouse as Record<string, MouseSkill>;
    return Object.prototype.hasOwnProperty.call(mouseSkills, skillId)
      ? mouseSkills[skillId]
      : undefined;
  }
  return undefined;
}

// Generate static params for all special skills
export function generateStaticParams() {
  return (['cat', 'mouse'] as const).flatMap((factionId) =>
    Object.keys((specialSkills[factionId] as Record<string, CatSkill | MouseSkill>) || {}).map(
      (skillId) => ({
        factionId,
        skillId,
      })
    )
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ factionId: string; skillId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const skillId = decodeURIComponent(resolvedParams.skillId);
  const factionIdRaw = decodeURIComponent(resolvedParams.factionId);
  if (factionIdRaw !== 'cat' && factionIdRaw !== 'mouse') {
    return {};
  }
  const factionId = factionIdRaw as FactionId;
  const skill = getSkill(factionId, skillId);

  if (!skill) {
    return {};
  }

  const desc = skill.description ?? `${skill.name}技能详情`;
  return generateArticleMetadata({
    title: skill.name,
    description: desc,
    keywords: [skill.name, '特殊技能'],
    canonicalUrl: `https://tjwiki.com/special-skills/${encodeURIComponent(factionId)}/${encodeURIComponent(skillId)}`,
    imageUrl: skill.imageUrl,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${skill.name} - 猫鼠wiki`,
      description: desc,
      author: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
      publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://tjwiki.com/special-skills/${encodeURIComponent(factionId)}/${encodeURIComponent(skillId)}`,
      },
    },
  });
}

export default async function SpecialSkillDetailPage({
  params,
}: {
  params: Promise<{ factionId: string; skillId: string }>;
}) {
  const result = await params;
  const skillId = decodeURIComponent(result.skillId);
  const factionIdRaw = decodeURIComponent(result.factionId);
  if (factionIdRaw !== 'cat' && factionIdRaw !== 'mouse') {
    notFound();
  }
  const factionId = factionIdRaw as FactionId;
  const skill = getSkill(factionId, skillId);

  if (!skill) {
    notFound();
  }

  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={true}>
          <SpecialSkillDetailClient skill={skill} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
