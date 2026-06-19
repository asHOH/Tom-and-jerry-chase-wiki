import type { IconProps } from '@/components/icons/CommonIcons';

const getSvgAriaProps = (decorative: boolean, ariaLabel: string, title?: string) => {
  if (decorative) {
    return { 'aria-hidden': true as const };
  }

  return {
    role: 'img' as const,
    'aria-label': title ?? ariaLabel,
  };
};

export const HappyFaceIcon = ({ size = 16, decorative = false, title, ...props }: IconProps) => {
  const { ['aria-label']: ariaLabelProp, ...rest } = props;
  const ariaLabel = ariaLabelProp ?? 'smile';

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      focusable='false'
      {...getSvgAriaProps(decorative, ariaLabel, title)}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
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

export const NeutralFaceIcon = ({ size = 16, decorative = false, title, ...props }: IconProps) => {
  const { ['aria-label']: ariaLabelProp, ...rest } = props;
  const ariaLabel = ariaLabelProp ?? 'neutral';

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      focusable='false'
      {...getSvgAriaProps(decorative, ariaLabel, title)}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
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

export const SadFaceIcon = ({ size = 16, decorative = false, title, ...props }: IconProps) => {
  const { ['aria-label']: ariaLabelProp, ...rest } = props;
  const ariaLabel = ariaLabelProp ?? 'sad';

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      focusable='false'
      {...getSvgAriaProps(decorative, ariaLabel, title)}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
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

export const HeartIcon = ({ size = 16, decorative = false, title, ...props }: IconProps) => {
  const { ['aria-label']: ariaLabelProp, ...rest } = props;
  const ariaLabel = ariaLabelProp ?? 'heart';

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      focusable='false'
      {...getSvgAriaProps(decorative, ariaLabel, title)}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
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
// 在 CharacterRelationIcons.tsx 中恢复最初的设计
export const AdvantageIcon = ({ size = 16, decorative = false, title, ...props }: IconProps) => {
  const { ['aria-label']: ariaLabelProp, ...rest } = props;
  const ariaLabel = ariaLabelProp ?? 'advantage';

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 20 20' // 最初的设计使用 20x20
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
      focusable='false'
      {...getSvgAriaProps(decorative, ariaLabel, title)}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z'
      />
    </svg>
  );
};

export const DisadvantageIcon = ({ size = 16, decorative = false, title, ...props }: IconProps) => {
  const { ['aria-label']: ariaLabelProp, ...rest } = props;
  const ariaLabel = ariaLabelProp ?? 'disadvantage';

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 20 20' // 最初的设计使用 20x20
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
      focusable='false'
      {...getSvgAriaProps(decorative, ariaLabel, title)}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z'
      />
    </svg>
  );
};

export const MapIcon = ({ size = 16, decorative = false, title, ...props }: IconProps) => {
  const { ['aria-label']: ariaLabelProp, ...rest } = props;
  const ariaLabel = ariaLabelProp ?? 'map';

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 20 20' // 最初的设计使用 20x20
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
      focusable='false'
      {...getSvgAriaProps(decorative, ariaLabel, title)}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293A1 1 0 0118 6v10a1 1 0 01-.293.707L14 14.586V1.586l3.707 1.707z'
      />
    </svg>
  );
};
