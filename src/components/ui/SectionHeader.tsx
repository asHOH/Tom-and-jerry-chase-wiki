'use client';

import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  children?: ReactNode;
}

export default function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <div className='flex justify-between items-center mb-3'>
      <h2 className='text-2xl font-bold dark:text-white py-2'>{title}</h2>
      {children}
    </div>
  );
}
