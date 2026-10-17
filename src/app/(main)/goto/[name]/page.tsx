import { notFound } from 'next/navigation';

import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import { getGotoResult } from '@/lib/gotoUtils';
import { itemGroups as staticItemGroups } from '@/data/static';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';
import GotoLink from '@/components/GotoLink';
import StaticRedirect from '@/components/StaticRedirect';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const { data } = await getPublishedGameDataSnapshot();
  const names = new Set<string>();
  const addFrom = (value: unknown) => {
    if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) names.add(key);
    }
  };
  addFrom(data.characters);
  addFrom(data.cards);
  addFrom(data.entities);
  addFrom(data.buffs);
  addFrom(data.items);
  addFrom(data.fixtures);
  addFrom(data.maps);
  addFrom(data.modes);
  addFrom(data.specialSkills?.cat);
  addFrom(data.specialSkills?.mouse);
  addFrom(data.achievements?.cat);
  addFrom(data.achievements?.mouse);
  addFrom(staticItemGroups);
  return [...names].map((name) => ({ name }));
}

export default async function GotoPage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent((await params).name);
  const snapshot = await getPublishedGameDataSnapshot();
  const result = await getGotoResult(name, undefined, { gameData: snapshot.data });

  if (!result) notFound();

  if (result.type !== 'disambiguation') {
    return <StaticRedirect url={result.url} title={`正在跳转：${result.name}`} />;
  }

  return (
    <PageShell width='narrow' className='py-6'>
      <PageHeader title={result.name} description={`${result.name}可能指：`} />
      <Card
        as='ul'
        className='bg-surface/60 text-foreground dark:bg-background/40 mt-4 list-inside list-disc space-y-2 text-lg shadow-sm'
      >
        {result.candidates.map((c) => (
          <li key={`${c.type}@@${c.url}`}>
            <GotoLink
              name={c.name}
              href={c.url}
              prefetchedPreview={{
                url: c.url,
                type: c.type,
                name: c.name,
                description: c.description ?? '',
                imageUrl: c.imageUrl ?? '',
                ...(c.factionId ? { factionId: c.factionId } : {}),
                ...(c.ownerName ? { ownerName: c.ownerName } : {}),
                ...(c.ownerFactionId ? { ownerFactionId: c.ownerFactionId } : {}),
                className: '',
              }}
            >
              <span className='underline decoration-solid decoration-1 underline-offset-2'>
                {c.name}（{c.categoryLabel}）
              </span>
            </GotoLink>
            <span className='text-gray-600 dark:text-gray-400'>，{c.kindDescription}</span>
          </li>
        ))}
      </Card>
    </PageShell>
  );
}
