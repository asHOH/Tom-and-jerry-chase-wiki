import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { specialSkills } from '@/data';
import type { FactionId } from '@/data/types';
import { Article, WithContext } from 'schema-dts';

import { generateArticleMetadata } from '@/lib/metadataUtils';
import StructuredData from '@/components/StructuredData';

import SpecialSkillDetailClient from './SpecialSkillDetailClient';

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

function generateStructuredData(
  factionId: FactionId,
  skillId: string
): WithContext<Article> | null {
  const skill = getSkill(factionId, skillId);

  if (!skill) {
    return null;
  }

  const desc = skill.description ?? `${skill.name}技能详情`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${skill.name} - 猫鼠wiki`,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    image: skill.imageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tjwiki.com/special-skills/${encodeURIComponent(factionId)}/${encodeURIComponent(skillId)}`,
    },
  };
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
    <>
      <StructuredData data={generateStructuredData(factionId, skillId)} />
      <SpecialSkillDetailClient skill={skill} />
    </>
  );
}
