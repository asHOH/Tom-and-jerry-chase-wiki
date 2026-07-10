import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  ENTITY_LABELS,
  getEntityByTypeAndId,
  routeSegmentToScope,
  VALID_ENTITY_TYPES,
} from '@/lib/comments/scopeMapping';
import { TalkPage } from '@/features/discussion/TalkPage';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}): Promise<Metadata> {
  const { segments } = await params;
  const entityType = segments[0];
  if (!entityType || !(VALID_ENTITY_TYPES as readonly string[]).includes(entityType)) {
    return {};
  }

  if (segments.length === 1) {
    return { title: `${ENTITY_LABELS[entityType] ?? entityType} - 讨论` };
  }

  const entityId = decodeURIComponent(segments.slice(1).join('/'));
  const entity = getEntityByTypeAndId(entityType, entityId);
  if (!entity) return {};
  return { title: `${entity.name} - 讨论` };
}

export default async function DiscussPage({ params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const entityType = segments[0];
  if (!entityType || !(VALID_ENTITY_TYPES as readonly string[]).includes(entityType)) {
    notFound();
  }

  if (segments.length === 1) {
    const label = ENTITY_LABELS[entityType] ?? entityType;
    return <TalkPage scope='list_pages' targetId={entityType} entityTitle={label} />;
  }

  const entityId = decodeURIComponent(segments.slice(1).join('/'));
  const entity = getEntityByTypeAndId(entityType, entityId);
  if (!entity) notFound();

  const scope = routeSegmentToScope(entityType);
  return <TalkPage scope={scope} targetId={entityId} entityTitle={entity.name} />;
}
