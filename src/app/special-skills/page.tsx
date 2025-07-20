import { Metadata } from 'next';
import SpecialSkillClient from './SpecialSkillClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '特殊技能 - 猫鼠wiki',
  description: '特殊技能列表，展示所有特殊技能及其效果',
  keywords: ['特殊技能', '猫和老鼠', '手游', '攻略'],
  canonicalUrl: 'https://tjwiki.com/special-skills',
});

export default function SpecialSkillsPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <SpecialSkillClient />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
