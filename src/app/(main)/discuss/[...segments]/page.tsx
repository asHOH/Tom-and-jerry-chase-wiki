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

  const label = ENTITY_LABELS[entityType] ?? entityType;

  if (segments.length === 1) {
    return { title: `${label} - 讨论` };
  }

  const entityId = decodeURIComponent(segments.slice(1).join('/'));
  const entity = getEntityByTypeAndId(entityType, entityId);
  if (!entity) return {};
  return { title: `${entity.name} (${label}) - 讨论` };
}

export default async function DiscussPage({ params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const entityType = segments[0];
  if (!entityType || !(VALID_ENTITY_TYPES as readonly string[]).includes(entityType)) {
    notFound();
  }

  const entityTypeLabel = ENTITY_LABELS[entityType] ?? entityType;

  if (segments.length === 1) {
    const label = entityTypeLabel;
    const parentUrl = `/${entityType}/`;
    return (
      <TalkPage
        scope='list_pages'
        targetId={entityType}
        entityTitle={label}
        entityTypeLabel={entityTypeLabel}
        parentUrl={parentUrl}
      />
    );
  }

  const entityId = decodeURIComponent(segments.slice(1).join('/'));
  const entity = getEntityByTypeAndId(entityType, entityId);
  if (!entity) notFound();

  const scope = routeSegmentToScope(entityType);
  const parentUrl = `/${entityType}/${segments.slice(1).join('/')}/`;
  return (
    <TalkPage
      scope={scope}
      targetId={entityId}
      entityTitle={entity.name}
      entityTypeLabel={entityTypeLabel}
      parentUrl={parentUrl}
    />
  );
}
