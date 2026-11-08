'use client';

import { FormSelect } from '@/components/ui/FormControls';

type CharacterRelationTagSelectProps = {
  value: string;
  options: readonly string[];
  onChange: (tag: string) => void;
  'aria-label': string;
};

export default function CharacterRelationTagSelect({
  value,
  options,
  onChange,
  'aria-label': ariaLabel,
}: CharacterRelationTagSelectProps) {
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
      {value && !options.includes(value) && (
        <option value={value} disabled>
          {value}（当前方向不可用）
        </option>
      )}
      {options.map((tag) => (
        <option key={tag} value={tag}>
          {tag}
        </option>
      ))}
    </FormSelect>
  );
}
