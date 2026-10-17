'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RandomRedirectClient({ paths }: { paths: string[] }) {
  const router = useRouter();

  useEffect(() => {
    const path = paths[Math.floor(Math.random() * paths.length)];
    if (path) router.replace(path);
  }, [paths, router]);

  return (
    <div className='flex min-h-[40vh] items-center justify-center text-gray-500'>正在跳转…</div>
  );
}
