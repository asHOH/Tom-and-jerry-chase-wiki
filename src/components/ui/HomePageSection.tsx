'use client';

import React from 'react';

import FactionButton from '@/components/ui/FactionButton';
import FactionButtonGroup from '@/components/ui/FactionButtonGroup';

interface FactionButtonProps {
  imageSrc: string;
  imageAlt: string;
  title?: string;
  description: string;
  href: string;
  ariaLabel: string;
}

interface HomePageSectionProps {
  title?: string;
  buttons: FactionButtonProps[];
}

const HomePageSection: React.FC<HomePageSectionProps> = ({ title, buttons }) => {
  return (
    <div className='mt-16 flex flex-col items-center px-2 md:px-4'>
      {title !== undefined && (
        <h2 className='mb-4 py-3 text-3xl font-bold text-gray-800 dark:text-white'>{title}</h2>
      )}
      <FactionButtonGroup>
        {buttons.map((button, index) => (
          <FactionButton
            key={index}
            imageSrc={button.imageSrc}
            imageAlt={button.imageAlt}
            title={button.title || ''}
            description={button.description}
            href={button.href}
            ariaLabel={button.ariaLabel}
            preload
          />
        ))}
      </FactionButtonGroup>
    </div>
  );
};

export default HomePageSection;
