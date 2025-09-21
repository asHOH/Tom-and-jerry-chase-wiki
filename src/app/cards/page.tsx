import { Metadata } from 'next';
import KnowledgeCardClient from './KnowledgeCardClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

const DESCRIPTION = '提升猫击倒、放飞老鼠的能力与老鼠生存、救援和推奶酪的能力';

export const metadata: Metadata = generatePageMetadata({
  title: '知识卡',
  description: DESCRIPTION,
  keywords: ['知识卡'],
  canonicalUrl: 'https://tjwiki.com/cards',
});

export default function CardsPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <KnowledgeCardClient description={DESCRIPTION} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
