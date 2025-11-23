'use client';

import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  children?: ReactNode;
}

export default function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <div className='mb-3 flex items-center justify-between'>
      <h2 className='py-2 text-2xl font-bold dark:text-white'>{title}</h2>
      {children}
    </div>
  );
}
