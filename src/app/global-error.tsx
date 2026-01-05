'use client';

import { useEffect } from 'react';
import Error from 'next/error';

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>{/* Your Error component here... */}</body>
    </html>
  );
}
