'use client';

import React from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

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
  const [sectionRef, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
    rootMargin: '0px 0px -10% 0px',
  });

  return (
    <div
      ref={sectionRef}
      className={`mt-12 flex flex-col items-center px-2 transition-all duration-300 ease-out md:mt-16 md:px-4 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      {title !== undefined && (
        <h2
          className='mb-4 py-3 text-3xl leading-tight font-bold tracking-tight text-gray-800 md:text-4xl dark:text-white'
          style={{ fontFamily: 'var(--font-display-stack)' }}
        >
          {title}
        </h2>
      )}
      <FactionButtonGroup>
        {buttons.map((button, index) => (
          <React.Fragment key={button.href}>
            <FactionButton
              imageSrc={button.imageSrc}
              imageAlt={button.imageAlt}
              title={button.title || ''}
              description={button.description}
              href={button.href}
              ariaLabel={button.ariaLabel}
              preload
            />
            {buttons.length == 4 && index == 1 && <div className='hidden h-0 w-full sm:block' />}
          </React.Fragment>
        ))}
      </FactionButtonGroup>
    </div>
  );
};

export default HomePageSection;
