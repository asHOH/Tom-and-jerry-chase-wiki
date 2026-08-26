'use client';

import { FormInput, FormSelect } from '@/components/ui/FormControls';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PendingActionWarningBoundary } from '@/components/ui/PendingActionWarning';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';

type EditableStringListProps = {
  actionPath?: string;
  values: readonly string[];
  onChange: (values: string[]) => void;
  itemLabel: string;
  options?: readonly string[] | undefined;
};

export default function EditableStringList({
  actionPath,
  values,
  onChange,
  itemLabel,
  options,
}: EditableStringListProps) {
  const availableOptions = options?.filter((option) => !values.includes(option)) ?? [];

  const content = (
    <div className='mt-1 space-y-2'>
      {values.map((value, index) => (
        <div key={`${itemLabel}-${index}`} className='flex items-center gap-2'>
          {options ? (
            <FormSelect
              size='sm'
              value={value}
              aria-label={`${itemLabel}${index + 1}`}
              onChange={(event) =>
                onChange(
                  values.map((candidate, itemIndex) =>
                    itemIndex === index ? event.target.value : candidate
                  )
                )
              }
            >
              {!options.includes(value) ? <option value={value}>{value}</option> : null}
              {options.map((option) => (
                <option
                  key={option}
                  value={option}
                  disabled={option !== value && values.includes(option)}
                >
                  {option}
                </option>
              ))}
            </FormSelect>
          ) : (
            <FormInput
              size='sm'
              value={value}
              aria-label={`${itemLabel}${index + 1}`}
              onChange={(event) =>
                onChange(
                  values.map((candidate, itemIndex) =>
                    itemIndex === index ? event.target.value : candidate
                  )
                )
              }
            />
          )}
          <IconButton
            type='button'
            aria-label={`删除${itemLabel}${index + 1}`}
            variant='delete'
            size='sm'
            onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
          >
            <TrashIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
          </IconButton>
        </div>
      ))}
      <IconButton
        type='button'
        aria-label={`添加${itemLabel}`}
        variant='add'
        size='sm'
        disabled={Boolean(options && availableOptions.length === 0)}
        onClick={() => onChange([...values, availableOptions[0] ?? '新条目'])}
      >
        <PlusIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
      </IconButton>
    </div>
  );

  return actionPath ? (
    <PendingActionWarningBoundary
      descriptors={[{ op: 'set', path: actionPath, hasNewValue: true }]}
    >
      {content}
    </PendingActionWarningBoundary>
  ) : (
    content
  );
}
