import { notFound } from 'next/navigation';
import { specialSkills } from '@/data';
import SpecialSkillDetailClient from './SpecialSkillDetailClient';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';

export default function SpecialSkillDetailPage({
  params,
}: {
  params: { factionId: string; skillId: string };
}) {
  const skillId = decodeURIComponent(params.skillId);
  const factionId = decodeURIComponent(params.factionId) as 'cat' | 'mouse';
  const skill = specialSkills[factionId]?.[skillId];

  if (!skill) {
    notFound();
  }

  return (
    <AppProvider>
      <AppProvider>
        <EditModeProvider>
          <TabNavigationWrapper showDetailToggle={true}>
            <SpecialSkillDetailClient skill={skill} />
          </TabNavigationWrapper>
        </EditModeProvider>
      </AppProvider>
    </AppProvider>
  );
}
