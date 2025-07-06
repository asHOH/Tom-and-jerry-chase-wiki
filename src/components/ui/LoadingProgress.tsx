'use client';

interface LoadingProgressProps {
  isVisible?: boolean;
}

export default function LoadingProgress({ isVisible = false }: LoadingProgressProps) {
  if (!isVisible) return null;

  return (
    <div className='fixed top-0 left-0 right-0 z-[10000] h-1 bg-gradient-to-r from-blue-600 to-blue-400'>
      <div className='h-full bg-blue-600 animate-pulse' />
    </div>
  );
}
