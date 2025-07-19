import fs from 'fs';
import path from 'path';
import Link from 'next/link';

interface DocPage {
  title: string;
  slug: string;
  path: string;
}

async function getDocPages(): Promise<DocPage[]> {
  const docsDir = path.join(process.cwd(), 'src/app/docs');
  const docPages: DocPage[] = [];

  try {
    const items = fs.readdirSync(docsDir, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith('.')) {
        const pagePath = path.join(docsDir, item.name, 'page.mdx');

        if (fs.existsSync(pagePath)) {
          try {
            const content = fs.readFileSync(pagePath, 'utf-8');

            // Extract title from the MDX file
            const titleMatch = content.match(/export\s+const\s+title\s*=\s*["']([^"']+)["']/);
            const title =
              titleMatch?.[1] ??
              item.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

            docPages.push({
              title,
              slug: item.name,
              path: `/docs/${item.name}`,
            });
          } catch (error) {
            console.warn(`Failed to read ${pagePath}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading docs directory:', error);
  }

  return docPages.sort((a, b) => a.title.localeCompare(b.title));
}

export default async function DocsIndexPage() {
  const docPages = await getDocPages();

  return (
    <div className='space-y-8'>
      <div className='text-center space-y-4'>
        <h1 className='text-4xl font-bold text-gray-900 dark:text-gray-100'>Documentation</h1>
        <p className='text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto'>
          Welcome to the Tom and Jerry Chase Wiki documentation. Browse through our guides and
          resources below.
        </p>
      </div>

      {docPages.length > 0 ? (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {docPages.map((page) => (
            <Link
              key={page.slug}
              href={page.path}
              className='group block p-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 hover:shadow-md dark:hover:shadow-slate-900/20 no-underline'
            >
              <div className='space-y-3'>
                <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                  {page.title}
                </h2>
                <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  /{page.slug}
                </div>
                <div className='flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors'>
                  Read more
                  <svg
                    className='w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <div className='text-gray-500 dark:text-gray-400 space-y-2'>
            <svg
              className='w-16 h-16 mx-auto text-gray-300 dark:text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <p className='text-lg'>No documentation pages found</p>
            <p className='text-sm'>Add MDX files to the docs directory to see them listed here.</p>
          </div>
        </div>
      )}

      <div className='border-t border-gray-200 dark:border-slate-700 pt-8'>
        <div className='bg-blue-50 dark:bg-slate-800/50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3'>
            Contributing to Documentation
          </h3>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>
            Want to add or improve documentation? Create a new folder in the docs directory with a{' '}
            <code className='bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded text-sm'>
              page.mdx
            </code>{' '}
            file.
          </p>
          <div className='text-sm text-gray-500 dark:text-gray-400 space-y-1'>
            <p>
              • Each page should export a <code>title</code> constant
            </p>
            <p>• Use MDX format for rich content with React components</p>
            <p>• Pages are automatically indexed and linked here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
