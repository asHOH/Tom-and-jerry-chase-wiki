'use client';

import { useEffect, type ReactNode } from 'react';

import { useEditMode } from '@/context/EditModeContext';

type PublishedRevisionBoundaryProps = {
  revisions: readonly `v1:${string}`[];
  children: ReactNode;
};

/** Registers the additional domain dependencies of a page that renders several domains. */
export default function PublishedRevisionBoundary({
  revisions,
  children,
}: PublishedRevisionBoundaryProps) {
  const { registerPublishedRevision } = useEditMode();
  useEffect(() => {
    const unregister = revisions.map(registerPublishedRevision);
    return () => unregister.forEach((cleanup) => cleanup());
  }, [registerPublishedRevision, revisions]);
  return children;
}
