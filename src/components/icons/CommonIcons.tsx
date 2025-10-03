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

export const CloseIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
  </SvgIcon>
);

export const ChevronLeftIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
  </SvgIcon>
);

export const ChevronRightIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
  </SvgIcon>
);

export const SearchIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
    />
  </SvgIcon>
);

export const CheckBadgeIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M4.5 12.75l6 6 9-13.5' />
  </SvgIcon>
);

export const ChatBubbleIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
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

export const UserCircleIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path d='M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' />
  </SvgIcon>
);

export const FolderIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path d='M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z' />
  </SvgIcon>
);

export const ClockIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path d='M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' />
  </SvgIcon>
);

export const EyeIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path d='M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z' />
    <path d='M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' />
  </SvgIcon>
);

export const PencilSquareIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path d='m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10' />
  </SvgIcon>
);
