import { env } from '@/env';

const ICP_FILING_SYSTEM_URL = 'https://beian.miit.gov.cn/';

export default function IcpFooter() {
  const recordNumber = env.NEXT_PUBLIC_ICP_RECORD_NUMBER;

  if (!recordNumber) {
    return null;
  }

  return (
    <footer className='border-border border-t px-4 py-3 text-center text-xs text-gray-600 dark:text-gray-400'>
      <a
        href={ICP_FILING_SYSTEM_URL}
        target='_blank'
        rel='noopener noreferrer'
        className='underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400'
      >
        {recordNumber}
      </a>
    </footer>
  );
}
