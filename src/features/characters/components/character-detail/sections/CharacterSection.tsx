'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/design';
import { useNavigation } from '@/hooks/useNavigation';
import Button from '@/components/ui/Button';
import {
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  LinkIcon,
} from '@/components/icons/CommonIcons';

const NO_CHILD_ANCHORS: readonly string[] = [];

export default function CharacterSection({
  title,
  children,
  to,
  childAnchorIds = NO_CHILD_ANCHORS,
}: {
  title: string;
  children: ReactNode;
  to?: string;
  childAnchorIds?: readonly string[];
}) {
  const sectionId = `Section:${title}`;
  const [isOpen, setIsOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(true); // Unmount content when folded to avoid lingering overlays
  const [isAnchorNavigation, setIsAnchorNavigation] = useState(false);
  const { navigate } = useNavigation();
  const anchorIdsRef = useRef(childAnchorIds);

  useEffect(() => {
    anchorIdsRef.current = childAnchorIds;
  }, [childAnchorIds]);

  useEffect(() => {
    let frame = 0;
    const revealAnchor = (hash: string) => {
      let id: string;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        return; // Malformed external fragments cannot identify a section.
      }
      if (to || (id !== sectionId && !anchorIdsRef.current.includes(id))) return;
      setIsAnchorNavigation(true);
      setIsMounted(true);
      setIsOpen(true);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
    };
    const handleHashChange = () => revealAnchor(window.location.hash);
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = event.target instanceof Element ? event.target.closest('a') : null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin === window.location.origin &&
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        revealAnchor(url.hash);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    document.addEventListener('click', handleClick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('click', handleClick);
    };
  }, [sectionId, to]);

  const toggleOpen = () => {
    if (to) {
      navigate(to);
      return;
    }

    setIsAnchorNavigation(false);
    if (isOpen) {
      // Start closing animation; unmount on transition end
      setIsOpen(false);
    } else {
      // Mount first, then open on next frame to allow transition-in
      setIsMounted(true);
      requestAnimationFrame(() => setIsOpen(true));
    }
  };

  return (
    <div
      className={cn(
        'flex scroll-mt-24 flex-col',
        !isAnchorNavigation && 'transition-all',
        isOpen ? 'duration-300 ease-out' : 'duration-200 ease-in',
        isOpen ? 'mb-8' : 'mb-0'
      )}
      id={sectionId}
    >
      <div className='mb-1 flex items-center px-2 py-3 text-2xl font-bold dark:text-white'>
        <div className='flex min-w-0 items-center gap-1'>
          <h2>
            <Button
              variant='unstyled'
              type='button'
              className='cursor-pointer focus:outline-none'
              aria-expanded={to ? undefined : isOpen}
              onClick={toggleOpen}
            >
              {title}
            </Button>
          </h2>
          <a
            href={`#${sectionId}`}
            aria-label={`链接到${title}`}
            title={`链接到“${title}”`}
            className='focus-visible:ring-focus rounded p-1 text-gray-400 opacity-0 transition-opacity hover:text-blue-600 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none dark:hover:text-blue-400'
          >
            <LinkIcon className='size-4' />
          </a>
        </div>
        <Button
          variant='unstyled'
          type='button'
          aria-expanded={to ? undefined : isOpen}
          aria-label={to ? `前往${title}` : isOpen ? `折叠${title}` : `展开${title}`}
          className='focus-visible:ring-focus ml-auto cursor-pointer rounded p-1 focus-visible:ring-2 focus-visible:outline-none'
          onClick={toggleOpen}
        >
          {to ? (
            <ArrowLeftOnRectangleIcon className='size-6' strokeWidth={1.5} />
          ) : (
            <ChevronDownIcon
              className={cn(
                'h-6 w-6 transform transition-transform duration-200 ease-out motion-reduce:transition-none',
                isOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          )}
        </Button>
      </div>
      {isMounted && (
        <div
          className={cn(
            isAnchorNavigation ? '' : 'transition-all ease-out',
            isOpen ? 'duration-300' : 'duration-200',
            isOpen ? 'max-h-2500 opacity-100' : 'max-h-0 opacity-0'
          )}
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          aria-hidden={!isOpen}
          inert={!isOpen}
          onTransitionEnd={() => {
            if (!isOpen) setIsMounted(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
