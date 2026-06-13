import type { PhysicalAttributes } from '@/data/types';

import AttributeSection from './AttributeSection';

type PhysicalAttributesSectionProps = {
  attributes: PhysicalAttributes;
  draftAttributes?: PhysicalAttributes | undefined;
  isEditMode: boolean;
};

const COLLISION_OPTIONS = ['角色', '道具', '墙壁', '平台', '地面'] as const;

const setDraftBooleanAttribute = (
  draftAttributes: PhysicalAttributes | undefined,
  field: 'move' | 'gravity',
  value: boolean
) => {
  if (!draftAttributes) return;
  draftAttributes[field] = value;
};

const toggleDraftCollision = (
  draftAttributes: PhysicalAttributes | undefined,
  option: string,
  checked: boolean
) => {
  if (!draftAttributes) return;

  const current = Array.isArray(draftAttributes.collision) ? draftAttributes.collision : [];
  const next = new Set(current);
  if (checked) next.add(option);
  else next.delete(option);
  const arr = Array.from(next);
  if (arr.length === 0) {
    delete draftAttributes.collision;
  } else {
    draftAttributes.collision = arr;
  }
};

const getCollisionClassName = (collisionTarget: string) => {
  if (collisionTarget === '角色') return 'text-red-600 dark:text-red-500';
  if (collisionTarget === '道具') return 'text-indigo-700 dark:text-indigo-400';
  return 'text-fuchsia-600 dark:text-fuchsia-400';
};

export default function PhysicalAttributesSection({
  attributes,
  draftAttributes,
  isEditMode,
}: PhysicalAttributesSectionProps) {
  if (
    !isEditMode &&
    attributes.move === undefined &&
    attributes.gravity === undefined &&
    attributes.collision === undefined
  ) {
    return null;
  }

  const activeCollision = Array.isArray(attributes.collision) ? attributes.collision : [];

  return (
    <AttributeSection title='移动信息'>
      <div className='auto-fill-grid grid-container grid grid-cols-[repeat(2,minmax(80px,1fr))] grid-rows-2 items-center justify-center gap-1 text-sm font-normal'>
        {isEditMode ? (
          <>
            <div className='flex items-center gap-1 text-xs'>
              <span className='text-xs text-gray-400 dark:text-gray-500'>移动:</span>
              <label className='flex cursor-pointer items-center gap-1'>
                <input
                  type='checkbox'
                  checked={attributes.move ?? false}
                  onChange={(e) => {
                    setDraftBooleanAttribute(draftAttributes, 'move', e.target.checked);
                  }}
                  className='h-3 w-3'
                />
                <span className='font-bold'>
                  {(attributes.move ?? false) ? '可移动' : '不可移动'}
                </span>
              </label>
            </div>
            <div className='flex items-center gap-1 text-xs'>
              <span className='text-xs text-gray-400 dark:text-gray-500'>重力:</span>
              <label className='flex cursor-pointer items-center gap-1'>
                <input
                  type='checkbox'
                  checked={attributes.gravity ?? false}
                  onChange={(e) => {
                    setDraftBooleanAttribute(draftAttributes, 'gravity', e.target.checked);
                  }}
                  className='h-3 w-3'
                />
                <span className='font-bold'>
                  {(attributes.gravity ?? false) ? '会受重力影响' : '不受重力影响'}
                </span>
              </label>
            </div>
            <div className='col-span-2 flex flex-wrap items-center gap-2 text-xs'>
              <span className='text-xs text-gray-400 dark:text-gray-500'>碰撞:</span>
              {COLLISION_OPTIONS.map((opt) => (
                <label key={opt} className='flex cursor-pointer items-center gap-1'>
                  <input
                    type='checkbox'
                    checked={activeCollision.includes(opt)}
                    onChange={(e) => {
                      toggleDraftCollision(draftAttributes, opt, e.target.checked);
                    }}
                    className='h-3 w-3'
                  />
                  <span className='font-bold'>{opt}</span>
                </label>
              ))}
            </div>
          </>
        ) : (
          <>
            {attributes.move !== undefined && (
              <span className='text-sm whitespace-pre'>
                {attributes.move === true ? (
                  <span className='text-green-600 dark:text-green-500'>可</span>
                ) : (
                  <span className='text-red-600 dark:text-red-500'>不可</span>
                )}
                移动
              </span>
            )}
            {attributes.gravity !== undefined && (
              <span className='text-sm whitespace-pre'>
                {attributes.gravity === true ? (
                  <span className='text-orange-600 dark:text-orange-400'>会受</span>
                ) : (
                  <span className='text-indigo-700 dark:text-indigo-400'>不受</span>
                )}
                重力影响
              </span>
            )}
            <span className='text-sm whitespace-pre'>
              {attributes.collision ? (
                <>
                  <span className='text-orange-600 dark:text-orange-400'>会</span>与
                  {attributes.collision.map((collisionTarget, key, array) => (
                    <span key={`${collisionTarget}-${key}`}>
                      <span className={getCollisionClassName(collisionTarget)}>
                        {collisionTarget}
                      </span>
                      {key < array.length - 1 ? '、' : ''}
                    </span>
                  ))}
                  产生碰撞
                </>
              ) : (
                <>
                  <span className='text-indigo-700 dark:text-indigo-400'>不会</span>
                  产生碰撞
                </>
              )}
            </span>
          </>
        )}
      </div>
    </AttributeSection>
  );
}
