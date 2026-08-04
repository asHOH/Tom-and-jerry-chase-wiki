import { USER_CONTENT_COPY } from '@/constants';

interface ConsentProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}

const getLabelClassName = (compact: boolean) =>
  compact
    ? 'flex items-start gap-2 text-xs text-gray-600 select-none dark:text-gray-400'
    : 'flex items-start gap-2 text-sm text-gray-700 select-none dark:text-gray-300';

const checkboxClassName =
  'mt-0.5 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800';

export function ContributionConsent({
  id,
  checked,
  onChange,
  disabled = false,
  compact = false,
}: ConsentProps) {
  return (
    <label htmlFor={id} className={`${getLabelClassName(compact)} cursor-pointer`}>
      <input
        type='checkbox'
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={checkboxClassName}
        disabled={disabled}
      />
      <span>
        {USER_CONTENT_COPY.contribution}{' '}
        <a
          href='https://creativecommons.org/licenses/by/4.0/deed.zh-hans'
          className='text-blue-600 hover:underline dark:text-blue-400'
          target='_blank'
          rel='noopener noreferrer'
          title='Creative Commons Attribution 4.0 International'
        >
          查看 CC BY 4.0 条款
        </a>
      </span>
    </label>
  );
}

export function CommunityConsent({
  id,
  checked,
  onChange,
  disabled = false,
  compact = false,
}: ConsentProps) {
  return (
    <label htmlFor={id} className={`${getLabelClassName(compact)} cursor-pointer`}>
      <input
        type='checkbox'
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={checkboxClassName}
        disabled={disabled}
      />
      <span>{USER_CONTENT_COPY.community}</span>
    </label>
  );
}

export function ImageRightsConsent({
  id,
  checked,
  onChange,
  disabled = false,
  compact = false,
}: ConsentProps) {
  return (
    <label htmlFor={id} className={`${getLabelClassName(compact)} cursor-pointer`}>
      <input
        type='checkbox'
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={checkboxClassName}
        disabled={disabled}
      />
      <span>{USER_CONTENT_COPY.image}</span>
    </label>
  );
}
