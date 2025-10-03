import React from 'react';

import { SvgIcon, type IconProps } from '@/components/icons/CommonIcons';

/**
 * Icon components for RichTextEditor toolbar
 */

// Text formatting icons
export const BoldIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} strokeWidth={1.5} {...rest}>
    <path
      strokeLinejoin='round'
      d='M6.75 3.744h-.753v8.25h7.125a4.125 4.125 0 0 0 0-8.25H6.75Zm0 0v.38m0 16.122h6.747a4.5 4.5 0 0 0 0-9.001h-7.5v9h.753Zm0 0v-.37m0-15.751h6a3.75 3.75 0 1 1 0 7.5h-6m0-7.5v7.5m0 0v8.25m0-8.25h6.375a4.125 4.125 0 0 1 0 8.25H6.75m.747-15.38h4.875a3.375 3.375 0 0 1 0 6.75H7.497v-6.75Zm0 7.5h5.25a3.75 3.75 0 0 1 0 7.5h-5.25v-7.5Z'
    />
  </SvgIcon>
));
BoldIcon.displayName = 'BoldIcon';

export const ItalicIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} strokeWidth={1.5} {...rest}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M5.248 20.246H9.05m0 0h3.696m-3.696 0 5.893-16.502m0 0h-3.697m3.697 0h3.803'
    />
  </SvgIcon>
));
ItalicIcon.displayName = 'ItalicIcon';

export const UnderlineIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} strokeWidth={2} {...rest}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M7 5v6a5 5 0 0010 0V5M7 19h10' />
  </SvgIcon>
));
UnderlineIcon.displayName = 'UnderlineIcon';

export const StrikethroughIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} fill='currentColor' stroke='none' {...rest}>
    <g>
      <text x='6' y='20' fontSize='22' fontFamily='Arial, sans-serif' fill='currentColor'>
        a
      </text>
      <line x1='2' y1='12' x2='22' y2='12' stroke='currentColor' strokeWidth='2' />
    </g>
  </SvgIcon>
));
StrikethroughIcon.displayName = 'StrikethroughIcon';

export const InlineCodeIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} viewBox='0 0 20 20' fill='currentColor' stroke='none' {...rest}>
    <path
      fillRule='evenodd'
      d='M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z'
      clipRule='evenodd'
    />
  </SvgIcon>
));
InlineCodeIcon.displayName = 'InlineCodeIcon';

// List icons
export const BulletListIcon = React.memo<IconProps>(({ className = 'w-4 h-4', ...rest }) => (
  <SvgIcon className={className} strokeWidth={1.5} {...rest}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z'
    />
  </SvgIcon>
));
BulletListIcon.displayName = 'BulletListIcon';

export const OrderedListIcon = React.memo<IconProps>(({ className = 'w-4 h-4', ...rest }) => (
  <SvgIcon className={className} strokeWidth={1.5} {...rest}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 1 1 1.591 1.59l-1.83 1.83h2.16M2.99 15.745h1.125a1.125 1.125 0 0 1 0 2.25H3.74m0-.002h.375a1.125 1.125 0 0 1 0 2.25H2.99'
    />
  </SvgIcon>
));
OrderedListIcon.displayName = 'OrderedListIcon';

// Alignment icons
export const AlignLeftIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} viewBox='0 0 20 20' fill='currentColor' stroke='none' {...rest}>
    <path
      fillRule='evenodd'
      d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z'
      clipRule='evenodd'
    />
  </SvgIcon>
));
AlignLeftIcon.displayName = 'AlignLeftIcon';

export const AlignCenterIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} viewBox='0 0 20 20' fill='currentColor' stroke='none' {...rest}>
    <path
      fillRule='evenodd'
      d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm-2 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z'
      clipRule='evenodd'
    />
  </SvgIcon>
));
AlignCenterIcon.displayName = 'AlignCenterIcon';

export const AlignRightIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} viewBox='0 0 20 20' fill='currentColor' stroke='none' {...rest}>
    <path
      fillRule='evenodd'
      d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zm-6 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z'
      clipRule='evenodd'
    />
  </SvgIcon>
));
AlignRightIcon.displayName = 'AlignRightIcon';

// Special content icons
export const BlockquoteIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} viewBox='0 0 24 24' fill='currentColor' stroke='none' {...rest}>
    {/* <circle cx='7' cy='8.4' r='3.6' />
    <path d='M6.6 10.95C3.86 12.07 2.35 14.26 2.35 17.36c0 1.62.7 2.92 2.05 3.7l-.52.61c-.76.89-2.19.84-3.02-.03C.41 21.25 0 20.36 0 19.3v-3.2c0-3.77 2.04-6.59 5.38-7.95l1.33-.54c.72-.3 1.46.29 1.32 1.04-.18.95-.63 1.82-1.35 2.65l-.08.1Z' />
    <circle cx='17' cy='8.4' r='3.6' />
    <path d='M16.6 10.95c-2.74 1.12-4.25 3.31-4.25 6.41 0 1.62.7 2.92 2.05 3.7l-.52.61c-.76.89-2.19.84-3.02-.03-.45-.48-.86-1.37-.86-2.43v-3.2c0-3.77 2.04-6.59 5.38-7.95l1.33-.54c.72-.3 1.46.29 1.32 1.04-.18.95-.63 1.82-1.35 2.65l-.08.1Z' /> */}
    <g fill='currentColor' transform='translate(1.25,13)'>
      <defs>
        <mask id='tailMask2x' maskContentUnits='userSpaceOnUse'>
          <rect x='-100' y='-100' width='300' height='300' fill='black' />
          <circle cx='10' cy='0' r='9' fill='white' />
          <circle cx='10.9' cy='-4.4' r='4.7' fill='black' />
          <rect x='-100' y='0' width='300' height='200' fill='black' />
          <rect x='10' y='-200' width='200' height='400' fill='black' />
        </mask>
      </defs>

      <circle cx='5' cy='0' r='4' />
      <rect x='0' y='-10' width='20' height='20' mask='url(#tailMask2x)' />

      <g transform='translate(11,0)'>
        <circle cx='5' cy='0' r='4' />
        <rect x='0' y='-10' width='20' height='20' mask='url(#tailMask2x)' />
      </g>
    </g>
  </SvgIcon>
));
BlockquoteIcon.displayName = 'BlockquoteIcon';

export const CodeBlockIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} viewBox='0 0 20 20' fill='none' stroke='currentColor' {...rest}>
    <rect x='0.3' y='1.5' width='19.4' height='17' rx='2' strokeWidth={1} />
    <path
      fillRule='evenodd'
      d='M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z'
      clipRule='evenodd'
      stroke='none'
      fill='currentColor'
    />
  </SvgIcon>
));
CodeBlockIcon.displayName = 'CodeBlockIcon';

export const LinkIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} strokeWidth={2} {...rest}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
    />
  </SvgIcon>
));
LinkIcon.displayName = 'LinkIcon';

export const ImageIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} strokeWidth={2} {...rest}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
    />
  </SvgIcon>
));
ImageIcon.displayName = 'ImageIcon';

// Undo/Redo icons
export const UndoIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} strokeWidth={2} {...rest}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6'
    />
  </SvgIcon>
));
UndoIcon.displayName = 'UndoIcon';

export const RedoIcon = React.memo<IconProps>(({ className = 'size-4', ...rest }) => (
  <SvgIcon className={className} strokeWidth={2} {...rest}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6'
    />
  </SvgIcon>
));
RedoIcon.displayName = 'RedoIcon';

// Loading spinner (used in loading state)
export const LoadingSpinnerIcon = React.memo<IconProps>(
  ({ className = 'animate-spin size-5 mr-2', ...rest }) => (
    <SvgIcon className={className} {...rest}>
      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
      <path
        className='opacity-75'
        fill='currentColor'
        d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
      />
    </SvgIcon>
  )
);
LoadingSpinnerIcon.displayName = 'LoadingSpinnerIcon';
