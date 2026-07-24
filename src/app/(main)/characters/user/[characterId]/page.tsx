import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';

import UserCharacterPageClient from './UserCharacterPageClient';

export const dynamic = 'force-dynamic';

// Generate static params for user character pages
// Since this is for user-generated content, we return empty array
// to indicate this should be handled dynamically
export async function generateStaticParams() {
  return [];
}

/**
 * This is the main page component, responsible for setting up the context providers.
 */
export default async function UserCharacterPage() {
  const readModel = await getPublishedDomainReadModel('characters');
  return <UserCharacterPageClient publishedRevision={readModel.revision} />;
}
