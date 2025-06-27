import React, { ReactNode } from 'react';

export default function CharacterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className='mb-6'>
      <h3 className='text-2xl font-bold px-2 py-3 mb-4'>{title}</h3>
      {children}
    </div>
  );
}
