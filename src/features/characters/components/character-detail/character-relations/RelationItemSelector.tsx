'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/design';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PlusIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

type RelationItemSelectorOption = {
  id: string;
  imageUrl?: string | undefined;
  imageClassName?: string | undefined;
};

type RelationItemSelectorProps = {
  options: RelationItemSelectorOption[];
  triggerAriaLabel: string;
  optionAriaLabel: (id: string) => string;
  onSelect: (id: string) => void;
  disabled?: boolean | undefined;
};

const RelationItemSelector: React.FC<RelationItemSelectorProps> = ({
  options,
  triggerAriaLabel,
  optionAriaLabel,
  onSelect,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
  };

  if (options.length === 0) {
    return null;
  }

  return (
    <div className='relative inline-block'>
      <IconButton
        type='button'
        onClick={() => !disabled && setIsOpen((current) => !current)}
        variant='add'
        size='md'
        aria-label={triggerAriaLabel}
        disabled={disabled}
      >
        <PlusIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
      </IconButton>

      {isOpen && (
        <div className='absolute top-full right-0 z-50 mt-1 max-h-48 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800'>
          {options.map(({ id, imageUrl, imageClassName }) => (
            <button
              key={id}
              type='button'
              onClick={() => handleSelect(id)}
              className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
              aria-label={optionAriaLabel(id)}
            >
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={id}
                  width={20}
                  height={20}
                  className={cn('h-5 w-5', imageClassName)}
                />
              )}
              <span className='text-gray-700 dark:text-gray-300'>{id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelationItemSelector;
