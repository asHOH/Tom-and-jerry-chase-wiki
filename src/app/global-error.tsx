'use client';

import { useEffect } from 'react';
import Error from 'next/error';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>{/* Your Error component here... */}</body>
    </html>
  );
}
