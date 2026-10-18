'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/design';
import { useAuthenticatedUserId } from '@/hooks/useAuthenticatedUserId';
import Button from '@/components/ui/Button';
import { ChatBubbleIcon, ChevronUpIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';
import { env } from '@/env';

const controlClassName =
  'flex size-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 dark:bg-blue-700 dark:hover:bg-blue-600';

export default function FloatingWikiControls() {
  const pathname = usePathname();
  const enabled = Boolean(env.NEXT_PUBLIC_AI_CHAT_MODEL);
  const { userId } = useAuthenticatedUserId(enabled);
  const [mounted, setMounted] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setShowTop(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!mounted) return null;
  return createPortal(
    <div className='pointer-events-none fixed right-6 bottom-6 z-30 flex flex-col items-center gap-3 pb-[env(safe-area-inset-bottom)]'>
      {enabled && userId && !/^\/ai\/?$/.test(pathname) ? (
        <Link
          href='/ai/'
          aria-label='AI 助手'
          title='AI 助手'
          className={cn(controlClassName, 'pointer-events-auto')}
        >
          <ChatBubbleIcon className='size-6' />
        </Link>
      ) : null}
      {showTop ? (
        <Button
          variant='unstyled'
          aria-label='返回顶部'
          title='返回顶部'
          className={cn(controlClassName, 'pointer-events-auto')}
          onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' })}
        >
          <ChevronUpIcon className='size-6' />
        </Button>
      ) : null}
    </div>,
    document.body
  );
}
