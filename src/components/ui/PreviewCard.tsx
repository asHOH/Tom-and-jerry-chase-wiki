import { cn, getTypeLabelColors } from '@/lib/design';
import { getOwnerSuffix } from '@/lib/singleItemTools';
import type { GotoDisambiguationCandidate } from '@/lib/types';
import { getFactionLabel } from '@/constants/factions';
import type { FactionId, SkillType } from '@/data/types';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import Image from '@/components/Image';
import Link from '@/components/Link';

import EntityCardFrame from './EntityCardFrame';
import Tag from './Tag';

export type GotoPreviewCardProps = {
  url: string;
  type: string;
  name: string;
  description?: string;
  imageUrl?: string;
  candidates?: GotoDisambiguationCandidate[];
  suggestions?: GotoDisambiguationCandidate[];
  className?: string;
  hideImage?: boolean;
  factionId?: FactionId;
  ownerName?: string;
  ownerFactionId?: FactionId;
  skillLevel?: number;
  skillType?: SkillType;
  skillLevelDescription?: string;
};

const typeLabels: Record<string, string> = {
  character: '角色',
  card: '知识卡',
  item: '道具',
  entity: '衍生物',
  'special-skill-cat': '猫特技',
  'special-skill-mouse': '鼠特技',
  disambiguation: '消歧义',
  doc: '文档',
  'character-skill': '技能',
  buff: '状态',
  itemGroup: '组合',
  map: '地图',
  fixture: '地图组件',
  mode: '游戏模式',
  achievement: '对局成就',
};

export default function PreviewCard({
  type,
  name,
  description,
  imageUrl,
  candidates,
  suggestions,
  className = '',
  hideImage = false,
  factionId,
  ownerName,
  ownerFactionId,
  skillLevel,
  skillType,
  skillLevelDescription,
}: GotoPreviewCardProps) {
  const characterTypeLabel = getFactionLabel(factionId)
    ? `${getFactionLabel(factionId)}${typeLabels[type] || type}`
    : typeLabels[type] || type;
  const ownerSuffix =
    type === 'character-skill' ? getOwnerSuffix(ownerName, ownerFactionId) : undefined;

  let previewDescription = description;
  if (type === 'character-skill') {
    if (skillType === 'passive') {
      previewDescription =
        skillLevelDescription && skillLevelDescription.trim().length > 0
          ? skillLevelDescription
          : description || '';
    } else {
      const base = description || '';
      const levelLine =
        skillLevelDescription && String(skillLevel ?? '').length > 0
          ? `\nLv. ${skillLevel}: ${skillLevelDescription}`
          : '';
      previewDescription = `${base}${levelLine}`.trim();
    }
  }

  const relatedCandidates = type === 'disambiguation' ? candidates : suggestions;
  const candidateList =
    Array.isArray(relatedCandidates) && relatedCandidates.length > 0 ? (
      <div className='mt-2 w-full text-sm text-gray-700 dark:text-gray-300'>
        <div className='mb-1'>
          {type === 'disambiguation' ? `${name}可能指：` : '你可能还想看：'}
        </div>
        <ul className='list-inside list-disc space-y-1'>
          {relatedCandidates.map((candidate) => (
            <li key={`${candidate.type}@@${candidate.url}`} className='leading-relaxed'>
              <Link
                href={candidate.url}
                className='underline decoration-solid decoration-1 underline-offset-2'
                aria-label={`前往：${candidate.name}（${candidate.categoryLabel}）`}
              >
                {candidate.name}（{candidate.categoryLabel}）
              </Link>
              <span className='text-muted-foreground'>（{candidate.kindDescription}）</span>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  const nameAndOwner = (
    <>
      <span className='min-w-0 truncate text-lg font-bold text-gray-900 dark:text-gray-100'>
        {typeof skillLevel === 'number' && type === 'character-skill'
          ? `${skillLevel}级${name}`
          : name}
      </span>
      {ownerSuffix ? (
        <span className='text-sm whitespace-nowrap text-gray-500 dark:text-gray-400'>
          {'\u00A0\u00A0'}
          {ownerSuffix}
        </span>
      ) : null}
    </>
  );

  const content = (
    <EntityCardFrame
      className={cn(
        'flex w-full max-w-xs flex-row items-start p-4 sm:max-w-sm md:max-w-md md:p-5 lg:max-w-lg lg:p-6',
        className
      )}
      variant='detail'
      interactive={false}
      role='link'
      tabIndex={-1}
    >
      {!hideImage && imageUrl ? (
        <div className='bg-surface-muted mr-4 flex h-24 w-24 shrink-0 items-center justify-center rounded-lg md:h-28 md:w-28 lg:h-36 lg:w-36'>
          <Image
            src={imageUrl}
            alt={name}
            width={128}
            height={128}
            sizes='(min-width: 1024px) 128px, (min-width: 768px) 112px, 96px'
            className='h-full w-full object-contain'
            loading='lazy'
            draggable={false}
          />
        </div>
      ) : null}

      <div className='flex w-0 flex-1 flex-col items-start'>
        {!hideImage && imageUrl ? (
          <>
            <Tag colorStyles={getTypeLabelColors(type)} size='xs' margin='compact' className='mb-2'>
              {type === 'character' ? characterTypeLabel : typeLabels[type] || type}
            </Tag>
            <div className='mb-1 flex w-full min-w-0 items-baseline' title={name}>
              {nameAndOwner}
            </div>
          </>
        ) : (
          <div className='mb-1 flex w-full items-center gap-2'>
            <div className='flex shrink-0 items-center gap-2'>
              <Tag colorStyles={getTypeLabelColors(type)} size='xs' margin='compact'>
                {type === 'character' ? characterTypeLabel : typeLabels[type] || type}
              </Tag>
            </div>
            <div className='flex min-w-0 flex-1 items-baseline' title={name}>
              {nameAndOwner}
            </div>
          </div>
        )}

        {type === 'disambiguation' && candidateList ? (
          candidateList
        ) : (
          <>
            {previewDescription ? (
              <div
                className={
                  type === 'character-skill'
                    ? 'line-clamp-3 w-full text-sm text-gray-600 dark:text-gray-300'
                    : 'line-clamp-3 w-full text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-300'
                }
                title={previewDescription}
              >
                <TextWithHoverTooltips text={previewDescription} />
              </div>
            ) : null}
            {candidateList}
          </>
        )}
      </div>
    </EntityCardFrame>
  );

  return (
    <div tabIndex={0} role='group' aria-label={`${typeLabels[type] || type}: ${name}`}>
      {content}
    </div>
  );
}
