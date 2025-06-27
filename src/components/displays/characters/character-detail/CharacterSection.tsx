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
    <div className='mb-6'>
      <button
        className='flex items-center justify-between w-full text-2xl font-bold px-2 py-3 mb-4 focus:outline-none cursor-pointer'
        onClick={toggleOpen}
        aria-expanded={isOpen}
      >
        <h3>{title}</h3>
        <svg
          className={`w-6 h-6 transform transition-transform duration-200 ${
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
      {isOpen && children}
    </div>
  );
}
