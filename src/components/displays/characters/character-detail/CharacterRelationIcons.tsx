import type { SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

export const PlusIcon = ({ width = 24, height = 24, ...props }: IconProps) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={2}
    stroke='currentColor'
    width={width}
    height={height}
    {...props}
  >
    <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
  </svg>
);

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

export const TrashIcon = ({ width = 24, height = 24, ...props }: IconProps) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={2}
    stroke='currentColor'
    width={width}
    height={height}
    {...props}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m-1.022.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165M12 2.252V5.25m0 0A2.25 2.25 0 0114.25 7.5h2.25M12 2.252V5.25m0 0A2.25 2.25 0 009.75 7.5H7.5'
    />
  </svg>
);
