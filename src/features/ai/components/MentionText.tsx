import { Fragment } from 'react';
import type { Route } from 'next';

import { extractChatReferences } from '@/lib/ai/chatReferences';
import Link from '@/components/Link';

export default function MentionText({ text }: { text: string }) {
  const matches = extractChatReferences(text);
  let end = 0;
  return (
    <>
      {matches.map(({ reference, start, end: nextEnd }) => {
        const before = text.slice(end, start);
        end = nextEnd;
        return (
          <Fragment key={`${start}:${reference.key}`}>
            {before}
            <Link
              href={reference.href as Route}
              target='_blank'
              rel='noopener noreferrer'
              title={`${reference.label} · ${reference.name}（在新标签页打开）`}
              className='mx-0.5 inline rounded-md bg-black/5 px-1.5 py-0.5 text-sm font-medium text-inherit no-underline hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15'
            >
              @{reference.name}
            </Link>
          </Fragment>
        );
      })}
      {text.slice(end)}
    </>
  );
}
