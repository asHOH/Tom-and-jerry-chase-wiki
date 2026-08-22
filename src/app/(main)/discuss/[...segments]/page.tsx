import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { resolveDiscussionTarget } from '@/lib/comments/scopeMapping';
import { TalkPage } from '@/features/discussion/TalkPage';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}): Promise<Metadata> {
  const { segments } = await params;
  const target = await resolveDiscussionTarget(segments);
  return target ? { title: target.metadataTitle } : {};
}

export default async function DiscussPage({ params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const target = await resolveDiscussionTarget(segments);
  if (!target) notFound();

  return (
    <TalkPage
      scope={target.scope}
      targetId={target.targetId}
      entityTitle={target.entityTitle}
      entityTypeLabel={target.entityTypeLabel}
      parentUrl={target.parentUrl}
    />
  );
}
