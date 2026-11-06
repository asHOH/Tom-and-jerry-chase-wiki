'use client';

import { useLayoutEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import singleItemReverse from '@/lib/singleItemReverse';
import { useEditableEntity } from '@/hooks/useEditableGameData';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { usePublishedRevision } from '@/hooks/usePublishedRevision';
import { useEditMode } from '@/context/EditModeContext';
import SingleItemReverseCard from '@/features/shared/components/SingleItemReverseCard';
import DetailReverseCard from '@/features/shared/detail-view/DetailReverseCard';
import { DraftReferenceCards } from '@/features/shared/detail-view/ReferencePageContent';
import CollapseCard from '@/components/ui/CollapseCard';
import { PageLoadingState } from '@/components/ui/LoadingState';
import CharacterDetailsClient from '@/app/(main)/characters/[characterId]/CharacterDetailsClient';

/**
 * This is the client component that contains the actual page logic.
 * It can safely use hooks that depend on the contexts provided by its parent.
 */
export default function UserCharacterPageClient({
  publishedRevision,
}: {
  publishedRevision: `v1:${string}`;
}) {
  usePublishedRevision('characters', publishedRevision);
  const { isLoading, isEditMode } = useEditMode();
  const { characterId } = useLocalCharacter();
  const [character] = useEditableEntity({ entityType: 'characters', entityId: characterId }, null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  useLayoutEffect(() => {
    if (searchParams.get('edit') !== '1') {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('edit', '1');
      replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    }
  }, [replace, searchParams, pathname]);

  if (isLoading) {
    return <PageLoadingState type='character-detail' message='加载角色详情中...' />;
  }

  if (!isEditMode) {
    return <PageLoadingState type='character-detail' message='请在编辑模式下查看角色草稿。' />;
  }

  if (!character) {
    return <PageLoadingState type='character-detail' message='未找到角色草稿，可能已被清除。' />;
  }

  // These private draft targets only exist in this browser's edit session.
  const root = { name: character.id, type: 'character' as const };
  const count = singleItemReverse(root).length;
  const cards = [
    count ? (
      <CollapseCard
        key='character'
        title={character.id + '自身的引用项(' + count + ')'}
        size='xs'
        className='rounded-md px-1 pb-1 whitespace-pre-wrap'
        titleClassName='pl-3'
      >
        <SingleItemReverseCard singleItem={root} />
      </CollapseCard>
    ) : null,
    ...character.skills.map((skill, index) => (
      <DetailReverseCard key={index} singleItem={{ name: skill.name, type: 'skill' }} />
    )),
  ];
  return (
    <DraftReferenceCards cards={cards}>
      <CharacterDetailsClient character={character} />
    </DraftReferenceCards>
  );
}
