'use client';

import { characterRelationTags } from '@/features/characters/utils/characterRelationTags';
import { FormSelect } from '@/components/ui/FormControls';

type CharacterRelationTagSelectProps = {
  value: string;
  existingTags?: readonly string[];
  onChange: (tag: string) => void;
  'aria-label': string;
};

export default function CharacterRelationTagSelect({
  value,
  existingTags = [],
  onChange,
  'aria-label': ariaLabel,
}: CharacterRelationTagSelectProps) {
  const options = [...new Set([...characterRelationTags, ...existingTags].filter(Boolean))];

  return (
    <FormSelect
      value={value}
      onChange={(event) => {
        const tag = event.currentTarget.value;
        if (options.includes(tag)) onChange(tag);
      }}
      aria-label={ariaLabel}
      size='sm'
      className='min-w-0 rounded-md py-1.5'
    >
      <option value='' disabled>
        选择克制分类
      </option>
      {options.map((tag) => (
        <option key={tag} value={tag}>
          {tag}
        </option>
      ))}
    </FormSelect>
  );
}
