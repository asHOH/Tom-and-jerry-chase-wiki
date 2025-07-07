'use client';

import React, { ReactNode, useState } from 'react';

export default function CharacterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`transition-all ${isOpen ? 'duration-300 ease-out' : 'duration-200 ease-in'} ${isOpen ? 'mb-8' : 'mb-0'}`}
    >
      <button
        type='button'
        aria-label={isOpen ? `折叠${title}` : `展开${title}`}
        className='flex items-center justify-between w-full text-2xl font-bold px-2 py-3 mb-1 focus:outline-none cursor-pointer'
        onClick={toggleOpen}
      >
        <h3>{title}</h3>
        <svg
          className={`w-6 h-6 transform transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-0' : '-rotate-90'
          }`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M19 9l-7 7-7-7'
          ></path>
        </svg>
      </button>
      <div
        className={`transition-all ease-out ${isOpen ? 'duration-300' : 'duration-200'} ${
          isOpen ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        {...(!isOpen && { 'aria-hidden': true })}
      >
        {children}
      </div>
    </div>
  );
}
