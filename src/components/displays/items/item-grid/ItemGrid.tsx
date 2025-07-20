'use client';

import Link from 'next/link';
import Image from 'next/image';
import { items } from '@/data';

export default function ItemClient() {
  return (
    <div className='max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'>
      <header className='text-center space-y-4 mb-8 px-4'>
        <h1 className='text-4xl font-bold text-blue-600 dark:text-blue-400 py-3'>道具一览</h1>
        <p className='text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4 py-2'>
          游戏内所有道具列表，点击道具可查看详细信息与效果。
        </p>
      </header>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8'>
        {Object.values(items).map(({ name, imageUrl }) => (
          <Link
            key={name}
            href={`/items/${encodeURIComponent(name)}`}
            className='block bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transform transition-all duration-200 hover:-translate-y-1 p-4 border border-gray-200 dark:border-slate-700'
          >
            <div className='flex flex-col items-center'>
              <div className='relative w-16 h-16 mb-2'>
                <Image src={imageUrl} alt={name} fill sizes='64px' className='object-contain' />
              </div>
              <div className='text-center'>
                <div className='font-semibold dark:text-white'>{name}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
