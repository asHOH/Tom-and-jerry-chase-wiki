'use client';

import PublishedReverseCard from './PublishedReverseCard';
import { useReferenceCards } from './ReferencePageContent';

export function useRouteReferenceCard(index = 0) {
  const value = useReferenceCards();
  if ('draftCards' in value) return value.draftCards[index] ?? null;
  const section = value.sections[index];
  return section?.groups.length ? <PublishedReverseCard section={section} /> : null;
}

export default function RouteReferenceCard({ index = 0 }: { index?: number }) {
  return useRouteReferenceCard(index);
}
