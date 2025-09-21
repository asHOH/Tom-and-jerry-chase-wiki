import { Metadata } from 'next';
import SpecialSkillClient from './SpecialSkillGridClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

const DESCRIPTION = '角色可配备的额外技能，合理使用将大幅提高角色能力';

export const metadata: Metadata = generatePageMetadata({
  title: '特技',
  description: DESCRIPTION,
  keywords: ['特技'],
  canonicalUrl: 'https://tjwiki.com/special-skills',
});

export default function SpecialSkillsPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <SpecialSkillClient description={DESCRIPTION} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
