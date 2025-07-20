import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { specialSkills } from '@/data';
import SpecialSkillDetailClient from './SpecialSkillDetailClient';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';

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
  const factionId = factionIdRaw as 'cat' | 'mouse';
  const skill = getSkill(factionId, skillId);

  if (!skill) {
    return {};
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: `${skill.name} - 猫鼠wiki`,
    description: skill.description,
    image: skill.imageUrl,
  };

  return {
    title: `${skill.name} - 猫鼠wiki`,
    description: skill.description,
    keywords: [skill.name, '特殊技能', '猫和老鼠', '手游', '攻略'],
    openGraph: {
      title: `${skill.name} - 猫鼠wiki`,
      description: skill.description,
      images: skill.imageUrl
        ? [
            {
              url: skill.imageUrl,
              alt: `${skill.name}技能图标`,
            },
          ]
        : [],
      type: 'article',
    },
    other: {
      'application/ld+json': JSON.stringify(structuredData),
    },
  };
}

export default function SpecialSkillDetailPage({
  params,
}: {
  params: { factionId: string; skillId: string };
}) {
  const skillId = decodeURIComponent(params.skillId);
  const factionIdRaw = decodeURIComponent(params.factionId);
  if (factionIdRaw !== 'cat' && factionIdRaw !== 'mouse') {
    notFound();
  }
  const factionId = factionIdRaw as 'cat' | 'mouse';
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
