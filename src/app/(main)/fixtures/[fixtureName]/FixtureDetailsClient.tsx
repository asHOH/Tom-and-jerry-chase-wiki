'use client';

import dynamic from 'next/dynamic';

import type { Fixture } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import LoadingState from '@/components/ui/LoadingState';

const FixtureDetails = dynamic(
  () => import('@/features/fixtures/components/fixture-detail/FixtureDetails'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState type='detail' message='加载地图组件详情中...' />
      </div>
    ),
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
