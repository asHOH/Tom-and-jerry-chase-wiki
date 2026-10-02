'use client';

import { splitCharacterRelationTraits } from '@/data/characterRelationData';
import type { CharacterRelationTag } from '@/data/types';
import { FormSelect } from '@/components/ui/FormControls';

const getTagKey = (tag: CharacterRelationTag) => JSON.stringify([tag.counters, tag.counteredBy]);

// Derive choices from the canonical relations without expanding generic counterTags inference.
const existingTagOptions = Array.from(
  new Map(
    splitCharacterRelationTraits.flatMap((trait) =>
      (trait.relation.tags ?? []).map((tag) => [getTagKey(tag), tag] as const)
    )
  ).values()
);

type CharacterRelationTagSelectProps = {
  value: CharacterRelationTag;
  existingTags?: readonly CharacterRelationTag[];
  onChange: (tag: CharacterRelationTag) => void;
  'aria-label': string;
};

export default function CharacterRelationTagSelect({
  value,
  existingTags = [],
  onChange,
  'aria-label': ariaLabel,
}: CharacterRelationTagSelectProps) {
  const options = Array.from(
    new Map(
      [...existingTagOptions, ...existingTags]
        .filter((tag) => tag.counters && tag.counteredBy)
        .map((tag) => [getTagKey(tag), tag] as const)
    ).values()
  );

  return (
    <FormSelect
      value={value.counters && value.counteredBy ? getTagKey(value) : ''}
      onChange={(event) => {
        const tag = options.find((option) => getTagKey(option) === event.currentTarget.value);
        if (tag) onChange({ ...tag });
      }}
      aria-label={ariaLabel}
      size='sm'
      className='min-w-0 rounded-md py-1.5'
    >
      <option value='' disabled>
        选择克制分类
      </option>
      {options.map((tag) => (
        <option key={getTagKey(tag)} value={getTagKey(tag)}>
          {tag.counters} / {tag.counteredBy}
        </option>
      ))}
    </FormSelect>
  );
}
