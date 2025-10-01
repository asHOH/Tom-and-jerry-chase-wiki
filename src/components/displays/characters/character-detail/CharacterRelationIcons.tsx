import type { IconProps } from '@/components/icons/CommonIcons';

export const HappyFaceIcon = ({ width = 16, height = 16, ...props }: IconProps) => {
  const { ['aria-label']: ariaLabelProp, ...rest } = props;
  const ariaLabel = ariaLabelProp ?? 'smile';

  return (
    <svg
      width={width}
      height={height}
      viewBox='0 0 16 16'
      fill='none'
      aria-label={ariaLabel}
      xmlns='http://www.w3.org/2000/svg'
      {...rest}
    >
      <circle cx='5' cy='6' r='1.25' fill='#2563eb' />
      <circle cx='11' cy='6' r='1.25' fill='#2563eb' />
      <path
        d='M4 9.5 Q8 12.7 12 9.5'
        stroke='#2563eb'
        strokeWidth={2}
        fill='none'
        strokeLinecap='round'
      />
    </svg>
  );
};

export const NeutralFaceIcon = ({ width = 16, height = 16, ...props }: IconProps) => {
  const { ['aria-label']: ariaLabelProp, ...rest } = props;
  const ariaLabel = ariaLabelProp ?? 'sad';

  return (
    <svg
      width={width}
      height={height}
      viewBox='0 0 16 16'
      fill='none'
      aria-label={ariaLabel}
      xmlns='http://www.w3.org/2000/svg'
      {...rest}
    >
      <circle cx='5' cy='6' r='1.25' fill='#ca8a04' />
      <circle cx='11' cy='6' r='1.25' fill='#ca8a04' />
      <path
        d='M5 11.25 L11 11.25'
        stroke='#ca8a04'
        strokeWidth={2}
        fill='none'
        strokeLinecap='round'
      />
    </svg>
  );
};

export const SadFaceIcon = ({ width = 16, height = 16, ...props }: IconProps) => {
  const { ['aria-label']: ariaLabelProp, ...rest } = props;
  const ariaLabel = ariaLabelProp ?? 'sad';

  return (
    <svg
      width={width}
      height={height}
      viewBox='0 0 16 16'
      fill='none'
      aria-label={ariaLabel}
      xmlns='http://www.w3.org/2000/svg'
      {...rest}
    >
      <circle cx='5' cy='6' r='1.25' fill='#dc2626' />
      <circle cx='11' cy='6' r='1.25' fill='#dc2626' />
      <path
        d='M4 11 Q8 9.5 12 11'
        stroke='#dc2626'
        strokeWidth={2}
        fill='none'
        strokeLinecap='round'
      />
    </svg>
  );
};

export const HeartIcon = ({ width = 16, height = 16, ...props }: IconProps) => {
  const { ['aria-label']: ariaLabelProp, ...rest } = props;
  const ariaLabel = ariaLabelProp ?? 'heart';

  return (
    <svg
      width={width}
      height={height}
      viewBox='0 0 16 16'
      fill='none'
      aria-label={ariaLabel}
      xmlns='http://www.w3.org/2000/svg'
      {...rest}
    >
      <path
        d='M8 13 C8 13 3.5 10.5 3.5 7.5 C3.5 6 4.7 4.8 6.2 4.8 C7.1 4.8 7.8 5.2 8 5.9 C8.2 5.2 8.9 4.8 9.8 4.8 C11.3 4.8 12.5 6 12.5 7.5 C12.5 10.5 8 13 8 13 Z'
        fill='#bbf7d0'
        stroke='#16a34a'
        strokeWidth={1.8}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};
