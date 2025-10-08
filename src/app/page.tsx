import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadataUtils';
import HomeContentClient from './HomeContentClient';

const DESCRIPTION = '查询猫和老鼠手游的角色、道具、知识卡等信息。';

export const dynamic = 'force-static';
export const metadata: Metadata = generatePageMetadata({
  title: '猫和老鼠手游wiki',
  description: DESCRIPTION,
  canonicalUrl: 'https://tjwiki.com/',
});

export default function Home() {
  return (
    <AppProvider>
      <EditModeProvider>
        <HomeContentClient description={DESCRIPTION} />
      </EditModeProvider>
    </AppProvider>
  );
}
