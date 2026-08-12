import type { ReactNode, SVGProps } from 'react';

// 一些用法：<PlusIcon className='w-5 h-5 text-muted-foreground' /> 或 <PlusIcon size={20} decorative={false} title='新增按钮' />
type IconBaseProps = Omit<SVGProps<SVGSVGElement>, 'aria-label' | 'width' | 'height' | 'role'> & {
  size?: number | string;
  strokeWidth?: number | string;
};

type DecorativeIconProps = {
  decorative?: true;
  title?: string;
  'aria-label'?: never;
};

type LabelledIconProps =
  | {
      decorative: false;
      title: string;
      'aria-label'?: string;
    }
  | {
      decorative: false;
      title?: string;
      'aria-label': string;
    };

export type IconProps = IconBaseProps & (DecorativeIconProps | LabelledIconProps);

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

export const ChevronDownIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
  </SvgIcon>
);

export const ChevronUpIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M5 15l7-7 7 7' />
  </SvgIcon>
);

export const ChevronRightSolidIcon = (props: IconProps) => (
  <SvgIcon viewBox='0 0 20 20' fill='currentColor' stroke='none' {...props}>
    <path
      fillRule='evenodd'
      d='M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0Z'
      clipRule='evenodd'
    />
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

export const LinkIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M10.5 13.5l3-3m-5.25 6.75-1.5 1.5a3.182 3.182 0 01-4.5-4.5l3-3a3.182 3.182 0 014.5 0m5.25-4.5 1.5-1.5a3.182 3.182 0 014.5 4.5l-3 3a3.182 3.182 0 01-4.5 0'
    />
  </SvgIcon>
);

export const CheckBadgeIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M4.5 12.75l6 6 9-13.5' />
  </SvgIcon>
);

export const CheckIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
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
      d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0'
    />
  </SvgIcon>
);

export const UserCircleIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path d='M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' />
  </SvgIcon>
);

export const HomeIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path d='m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' />
  </SvgIcon>
);

export const GlobeIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S7.5 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418'
    />
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

export const CircleIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <circle cx='12' cy='12' r='9' />
  </SvgIcon>
);

export const CheckCircleIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <circle cx='12' cy='12' r='9' />
    <path strokeLinecap='round' strokeLinejoin='round' d='M8 12l2.5 2.5L16 9' />
  </SvgIcon>
);

export const UserIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z'
    />
  </SvgIcon>
);

export const ArrowTopRightOnSquareIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25'
    />
  </SvgIcon>
);

export const ArrowUpTrayIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5'
    />
  </SvgIcon>
);

export const ArrowPathIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15'
    />
  </SvgIcon>
);

export const ArrowLeftOnRectangleIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='m7.49 12-3.75 3.75m0 0 3.75 3.75m-3.75-3.75h16.5V4.499'
    />
  </SvgIcon>
);

export const Bars3Icon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M4 6h16M4 12h16M4 18h16' />
  </SvgIcon>
);

export const ArchiveBoxIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2-2Z'
    />
    <path strokeLinecap='round' strokeLinejoin='round' d='M8 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2H8Z' />
  </SvgIcon>
);

export const DocumentTextIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z'
    />
  </SvgIcon>
);

export const CalendarIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z'
    />
  </SvgIcon>
);

export const LockClosedIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z'
    />
  </SvgIcon>
);

export const ShareIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684 6.632 3.316m-6.632-6 6.632-3.316m0 0a3 3 0 1 1 5.367-2.684 3 3 0 0 1-5.367 2.684Zm0 9.316a3 3 0 1 1 5.368 2.684 3 3 0 0 1-5.368-2.684Z'
    />
  </SvgIcon>
);

export const SunIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <circle cx='12' cy='12' r='5' />
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'
    />
  </SvgIcon>
);

export const MoonIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z'
    />
  </SvgIcon>
);

export const GripVerticalIcon = (props: IconProps) => (
  <SvgIcon fill='currentColor' stroke='none' {...props}>
    <circle cx='9' cy='5' r='2' />
    <circle cx='9' cy='12' r='2' />
    <circle cx='9' cy='19' r='2' />
    <circle cx='15' cy='5' r='2' />
    <circle cx='15' cy='12' r='2' />
    <circle cx='15' cy='19' r='2' />
  </SvgIcon>
);

export const InformationCircleIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z'
    />
  </SvgIcon>
);

export const ExclamationTriangleIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
    />
  </SvgIcon>
);

export const XCircleIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
    />
  </SvgIcon>
);

export const XCircleSolidIcon = (props: IconProps) => (
  <SvgIcon viewBox='0 0 20 20' fill='currentColor' stroke='none' {...props}>
    <path
      fillRule='evenodd'
      d='M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.707 7.293a1 1 0 0 0-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 1 0 1.414 1.414L10 11.414l1.293 1.293a1 1 0 0 0 1.414-1.414L11.414 10l1.293-1.293a1 1 0 0 0-1.414-1.414L10 8.586 8.707 7.293Z'
      clipRule='evenodd'
    />
  </SvgIcon>
);

export const TargetIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <circle cx='12' cy='12' r='10' />
    <circle cx='12' cy='12' r='6' />
    <circle cx='12' cy='12' r='2' />
  </SvgIcon>
);

export const ChartLineIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M3 3v18h18M7 16l4-8 4 4 4-6' />
  </SvgIcon>
);

export const SparklesIcon = ({ strokeWidth = 2, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16 2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3Z'
    />
  </SvgIcon>
);

export const ChevronUpCircleIcon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
  <SvgIcon strokeWidth={strokeWidth} {...props}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M8.25 13.75 12 10l3.75 3.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
    />
  </SvgIcon>
);
