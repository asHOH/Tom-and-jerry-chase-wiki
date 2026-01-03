'use client';

export default function SentryTestPage() {
  return (
    <div className='mx-auto max-w-xl space-y-8 p-8'>
      <h1 className='text-2xl font-bold'>Sentry Integration Test</h1>
      <p className='text-gray-600'>
        Click these buttons to trigger errors. Check your Sentry dashboard to see if they appear.
      </p>

      <div className='space-y-4'>
        <div className='rounded-lg border p-4'>
          <h2 className='mb-2 font-semibold'>Client-Side Error</h2>
          <button
            className='rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700'
            onClick={() => {
              throw new Error('Sentry Test: Client-side Error');
            }}
          >
            Throw Client Error
          </button>
        </div>

        <div className='rounded-lg border p-4'>
          <h2 className='mb-2 font-semibold'>Server-Side Error (API)</h2>
          <button
            className='rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
            onClick={async () => {
              try {
                const res = await fetch('/api/sentry-test');
                if (!res.ok) throw new Error('API request failed');
              } catch (e) {
                console.error(e);
                alert('Server error triggered! Check Sentry dashboard.');
              }
            }}
          >
            Trigger API Error
          </button>
        </div>
      </div>
    </div>
  );
}
