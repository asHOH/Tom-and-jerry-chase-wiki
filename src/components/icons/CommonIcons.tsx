import type { ReactNode, SVGProps } from 'react';

// 一些用法：<PlusIcon className='w-5 h-5 text-muted-foreground' /> 或 <PlusIcon size={20} decorative={false} title='新增按钮' />
export type IconProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height' | 'role'> & {
  size?: number | string;
  decorative?: boolean;
  title?: string;
  strokeWidth?: number | string;
};

type SvgIconProps = IconProps & {
  children: ReactNode;
};

export const SvgIcon = ({
  size = '1em',
  decorative = true,
  title,
  strokeWidth = 2,
  children,
  ...rest
}: SvgIconProps) => {
  const { 'aria-label': ariaLabel, ...restProps } = rest;

  const ariaProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': title ?? ariaLabel };

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={strokeWidth}
      width={size}
      height={size}
      focusable='false'
      {...restProps}
      {...ariaProps}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
};

export const PlusIcon = (props: IconProps) => (
  <SvgIcon {...props}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
  </SvgIcon>
);

export const TrashIcon = (props: IconProps) => (
  <SvgIcon {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m-1.022.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165M12 2.252V5.25m0 0A2.25 2.25 0 0114.25 7.5h2.25M12 2.252V5.25m0 0A2.25 2.25 0 009.75 7.5H7.5'
    />
  </SvgIcon>
);
