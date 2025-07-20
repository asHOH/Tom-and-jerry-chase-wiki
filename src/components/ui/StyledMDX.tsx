export default function StyledMDX({ children }: { children: React.ReactNode }) {
  return (
    <article className='prose prose-lg dark:prose-invert mx-auto transition-all duration-300 p-4 sm:p-6 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-700 dark:hover:prose-a:text-blue-300 prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-50 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-slate-700 prose-blockquote:border-l-blue-500 dark:prose-blockquote:border-l-blue-400 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-slate-800/50 prose-blockquote:rounded-r-lg prose-img:rounded-lg prose-img:shadow-sm prose-hr:border-gray-300 dark:prose-hr:border-slate-600 prose-p:mb-2 prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-h5:text-lg prose-h6:text-base'>
      {children}
    </article>
  );
}
