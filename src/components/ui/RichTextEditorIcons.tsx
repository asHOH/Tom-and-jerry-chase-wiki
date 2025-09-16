import React from 'react';

/**
 * Icon components for RichTextEditor toolbar
 * Extracted from inline SVGs to improve maintainability and reusability
 */

interface IconProps {
  className?: string;
}

// Text formatting icons
export const BoldIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
    className={className}
  >
    <path
      strokeLinejoin='round'
      d='M6.75 3.744h-.753v8.25h7.125a4.125 4.125 0 0 0 0-8.25H6.75Zm0 0v.38m0 16.122h6.747a4.5 4.5 0 0 0 0-9.001h-7.5v9h.753Zm0 0v-.37m0-15.751h6a3.75 3.75 0 1 1 0 7.5h-6m0-7.5v7.5m0 0v8.25m0-8.25h6.375a4.125 4.125 0 0 1 0 8.25H6.75m.747-15.38h4.875a3.375 3.375 0 0 1 0 6.75H7.497v-6.75Zm0 7.5h5.25a3.75 3.75 0 0 1 0 7.5h-5.25v-7.5Z'
    />
  </svg>
);

export const ItalicIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
    className={className}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M5.248 20.246H9.05m0 0h3.696m-3.696 0 5.893-16.502m0 0h-3.697m3.697 0h3.803'
    />
  </svg>
);

export const UnderlineIcon: React.FC<IconProps> = ({ className = 'size-4' }) => (
  <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M7 5v6a5 5 0 0010 0V5M7 19h10'
    />
  </svg>
);

export const StrikethroughIcon: React.FC<IconProps> = ({ className = 'size-4' }) => (
  <svg className={className} fill='currentColor' viewBox='0 0 24 24'>
    <g>
      <text x='6' y='20' fontSize='22' fontFamily='Arial, sans-serif' fill='currentColor'>
        a
      </text>
      <line x1='2' y1='12' x2='22' y2='12' stroke='currentColor' strokeWidth='2' />
    </g>
  </svg>
);

export const InlineCodeIcon: React.FC<IconProps> = ({ className = 'size-4' }) => (
  <svg className={className} fill='currentColor' viewBox='0 0 20 20'>
    <path
      fillRule='evenodd'
      d='M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z'
      clipRule='evenodd'
    />
  </svg>
);

// List icons
export const BulletListIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
    className={className}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z'
    />
  </svg>
);

export const OrderedListIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
    className={className}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 1 1 1.591 1.59l-1.83 1.83h2.16M2.99 15.745h1.125a1.125 1.125 0 0 1 0 2.25H3.74m0-.002h.375a1.125 1.125 0 0 1 0 2.25H2.99'
    />
  </svg>
);

// Alignment icons
export const AlignLeftIcon: React.FC<IconProps> = ({ className = 'size-4' }) => (
  <svg className={className} fill='currentColor' viewBox='0 0 20 20'>
    <path
      fillRule='evenodd'
      d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z'
      clipRule='evenodd'
    />
  </svg>
);

export const AlignCenterIcon: React.FC<IconProps> = ({ className = 'size-4' }) => (
  <svg className={className} fill='currentColor' viewBox='0 0 20 20'>
    <path
      fillRule='evenodd'
      d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm-2 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z'
      clipRule='evenodd'
    />
  </svg>
);

export const AlignRightIcon: React.FC<IconProps> = ({ className = 'size-4' }) => (
  <svg className={className} fill='currentColor' viewBox='0 0 20 20'>
    <path
      fillRule='evenodd'
      d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zm-6 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z'
      clipRule='evenodd'
    />
  </svg>
);

// Special content icons
export const BlockquoteIcon: React.FC<IconProps> = ({ className = 'size-4' }) => (
  <svg className={className} fill='currentColor' viewBox='0 0 24 24'>
    <path d='M14 17H7l-2 2V7a2 2 0 0 1 2-2h7m6 0v8a2 2 0 0 1-2 2h-5l-2 2V7a2 2 0 0 1 2-2h7Z' />
  </svg>
);

export const CodeBlockIcon: React.FC<IconProps> = ({ className = 'size-4' }) => (
  <svg className={className} fill='currentColor' viewBox='0 0 20 20'>
    <path
      fillRule='evenodd'
      d='M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z'
      clipRule='evenodd'
    />
  </svg>
);

export const LinkIcon: React.FC<IconProps> = ({ className = 'size-4' }) => (
  <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
    />
  </svg>
);

export const ImageIcon: React.FC<IconProps> = ({ className = 'size-4' }) => (
  <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
    />
  </svg>
);

// Undo/Redo icons
export const UndoIcon: React.FC<IconProps> = ({ className = 'size-4' }) => (
  <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6'
    />
  </svg>
);

export const RedoIcon: React.FC<IconProps> = ({ className = 'size-4' }) => (
  <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6'
    />
  </svg>
);

// Loading spinner (used in loading state)
export const LoadingSpinnerIcon: React.FC<IconProps> = ({
  className = 'animate-spin size-5 mr-2',
}) => (
  <svg className={className} fill='none' viewBox='0 0 24 24'>
    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
    <path
      className='opacity-75'
      fill='currentColor'
      d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
    />
  </svg>
);
