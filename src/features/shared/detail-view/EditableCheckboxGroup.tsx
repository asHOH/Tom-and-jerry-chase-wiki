'use client';

import { PendingActionWarningBoundary } from '@/components/ui/PendingActionWarning';

type EditableCheckboxGroupProps<Option extends string> = {
  actionPath?: string;
  options: readonly Option[];
  selected: readonly Option[];
  onChange: (selected: Option[]) => void;
  ariaLabelPrefix: string;
  minimumSelections?: number;
};

export default function EditableCheckboxGroup<Option extends string>({
  actionPath,
  options,
  selected,
  onChange,
  ariaLabelPrefix,
  minimumSelections = 0,
}: EditableCheckboxGroupProps<Option>) {
  const selectedSet = new Set(selected);

  const content = (
    <div className='flex flex-wrap gap-x-3 gap-y-1 text-xs'>
      {options.map((option) => {
        const checked = selectedSet.has(option);
        return (
          <label key={option} className='flex cursor-pointer items-center gap-1'>
            <input
              type='checkbox'
              aria-label={`${ariaLabelPrefix}${option}`}
              checked={checked}
              disabled={checked && selected.length <= minimumSelections}
              onChange={(event) => {
                const next = new Set(selected);
                if (event.target.checked) next.add(option);
                else next.delete(option);
                onChange(options.filter((candidate) => next.has(candidate)));
              }}
              className='h-3 w-3'
            />
            <span className='font-bold'>{option}</span>
          </label>
        );
      })}
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
