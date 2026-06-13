'use client';

import dynamic from 'next/dynamic';

import type { Fixture } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const FixtureDetails = dynamic(
  () => import('@/features/fixtures/components/fixture-detail/FixtureDetails'),
  {
    loading: () => <PageLoadingState type='detail' message='加载地图组件详情中...' />,
  }
);

export default function FixtureDetailsClient({
  fixture,
  fixtureName,
}: {
  fixture: Fixture;
  fixtureName: string;
}) {
  return (
    <EditModePageShell entityType='fixtures' entityId={fixtureName} entityName={fixtureName}>
      <FixtureDetails fixture={fixture} />
    </EditModePageShell>
  );
}
