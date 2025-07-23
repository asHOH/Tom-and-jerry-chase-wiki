'use client';

import { KnowledgeCardGrid } from '@/components/displays/knowledge-cards';
import { AppProvider } from '@/context/AppContext';

export default function KnowledgeCardClient() {
  return (
    <AppProvider>
      <KnowledgeCardGrid />
    </AppProvider>
  );
}
