'use client';

import React from 'react';
import FactionButton from '@/components/ui/FactionButton';
import FactionButtonGroup from '@/components/ui/FactionButtonGroup';
import { useNavigation } from '@/lib/useNavigation';

interface FactionButtonProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  href: string;
  ariaLabel: string;
}

interface HomePageSectionProps {
  title: string;
  buttons: FactionButtonProps[];
}

const HomePageSection: React.FC<HomePageSectionProps> = ({ title, buttons }) => {
  const { navigate } = useNavigation();

  return (
    <div className='flex flex-col items-center mt-16 px-2 md:px-4'>
      <h2 className='text-3xl font-bold mb-10 py-3 text-gray-800 dark:text-white'>{title}</h2>
      <FactionButtonGroup>
        {buttons.map((button, index) => (
          <FactionButton
            key={index}
            imageSrc={button.imageSrc}
            imageAlt={button.imageAlt}
            title={button.title}
            description={button.description}
            onClick={() => navigate(button.href)}
            ariaLabel={button.ariaLabel}
            priority
          />
        ))}
      </FactionButtonGroup>
    </div>
  );
};

export default HomePageSection;
