'use client';

import { cn } from '@/lib/design';
import type { EditableUpdate } from '@/hooks/useEditableGameData';
import type { EditableElementsProxy } from '@/components/ui/editableTypes';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PlusIcon } from '@/components/icons/CommonIcons';

type AliasEditorProps = {
  aliases?: readonly string[] | undefined;
  field: EditableElementsProxy['span'];
  update: EditableUpdate<{ aliases?: string[] }>;
  path?: string;
  className?: string;
};

export default function AliasEditor({
  aliases = [],
  field: Field,
  update,
  path = 'aliases',
  className,
}: AliasEditorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className='text-xs text-gray-400 dark:text-gray-500'>别名：</span>
      {aliases.length > 0 ? (
        aliases.map((alias, index) => (
          <span key={`${alias}-${index}`} className='inline-flex items-center'>
            <Field
              initialValue={alias || '<无内容>'}
              path={`${path}.${index}`}
              isSingleLine
              onSave={(newValue) => {
                update((draft) => {
                  draft.aliases ??= [];
                  const trimmed = newValue.trim();
                  if (trimmed === '') {
                    draft.aliases = draft.aliases.filter((_, aliasIndex) => aliasIndex !== index);
                  } else {
                    draft.aliases[index] = trimmed;
                  }
                });
              }}
            />
            {index < aliases.length - 1 && <span className='text-gray-400'>、</span>}
          </span>
        ))
      ) : (
        <span>{'<无内容>'}</span>
      )}
      <IconButton
        type='button'
        aria-label='添加别名'
        variant='add'
        size='xs'
        className='ml-2'
        onClick={() => {
          update((draft) => {
            draft.aliases ??= [];
            if (!draft.aliases.includes('新别名')) draft.aliases.push('新别名');
          });
        }}
      >
        <PlusIcon className={getIconButtonIconClassName('xs')} aria-hidden='true' />
      </IconButton>
    </div>
  );
}
