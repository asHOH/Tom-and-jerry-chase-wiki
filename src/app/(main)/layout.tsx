import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { TraitsProvider } from '@/context/TraitsContext';
import GlobalLayout from '@/components/GlobalLayout';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const traits = await getPublishedDomainReadModel('traits');

  return (
    <TraitsProvider data={traits.data} revision={traits.revision}>
      <GlobalLayout>{children}</GlobalLayout>
    </TraitsProvider>
  );
}
