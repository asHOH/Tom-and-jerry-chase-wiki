import RecommendedPageClient from './RecommendedPageClient';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '阵容推荐 - 猫鼠wiki',
  description: '根据对手选择的老鼠阵容，推荐最佳的猫角色。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RecommendedPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <RecommendedPageClient />
      </EditModeProvider>
    </AppProvider>
  );
}
