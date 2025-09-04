import { CREATORS, DISCLAIMER_CONTENT, LICENSE_INFO, PROJECT_INFO } from '@/constants';

interface DisclaimerTextProps {
  onFeedbackClick?: () => void;
}

export const DisclaimerText = ({ onFeedbackClick }: DisclaimerTextProps) => {
  // Helper function to render creator links
  const renderCreatorLinks = (creatorIds: readonly string[]) => {
    return creatorIds.map((creatorId, index) => (
      <span key={creatorId}>
        {index > 0 && '、'}
        {CREATORS[creatorId]?.url ? (
          <a
            href={CREATORS[creatorId].url}
            target='_blank'
            rel='nofollow noopener noreferrer'
            aria-label={`${CREATORS[creatorId]?.name ?? creatorId}（在新标签页打开）`}
            className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline whitespace-pre-wrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-[2px]'
          >
            {CREATORS[creatorId]?.name ?? creatorId}
          </a>
        ) : (
          <span className='text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
            {CREATORS[creatorId]?.name ?? creatorId}
          </span>
        )}
      </span>
    ));
  };

  return (
    <>
      {/* Project information */}
      <section className='mb-4' aria-label='项目信息'>
        <div className='inline-flex items-center gap-2 my-2 text-gray-700 dark:text-gray-300'>
          <svg
            className='w-5 h-5 text-gray-700 dark:text-gray-300'
            fill='currentColor'
            viewBox='0 0 20 20'
            xmlns='http://www.w3.org/2000/svg'
            aria-hidden='true'
          >
            <path
              fillRule='evenodd'
              d='M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z'
              clipRule='evenodd'
            />
          </svg>
          <a
            href={PROJECT_INFO.url}
            target='_blank'
            rel='nofollow noopener noreferrer'
            aria-label={`${PROJECT_INFO.title}（在新标签页打开）`}
            className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-[2px]'
          >
            {PROJECT_INFO.title}
          </a>
        </div>
        <p>
          本项目由{renderCreatorLinks([PROJECT_INFO.maintainerId])}维护，
          {PROJECT_INFO.descriptionParts.before}
          {onFeedbackClick ? (
            <button
              type='button'
              onClick={onFeedbackClick}
              className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer bg-transparent border-none p-0 font-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-[2px]'
            >
              {PROJECT_INFO.descriptionParts.feedbackLink}
            </button>
          ) : (
            PROJECT_INFO.descriptionParts.feedbackLink
          )}
          {PROJECT_INFO.descriptionParts.after}
        </p>
      </section>

      {/* Website nature and commitments */}
      <section className='mb-4' aria-label='网站性质与承诺'>
        <p>{DISCLAIMER_CONTENT.intro}</p>
        <p>{DISCLAIMER_CONTENT.privacyPolicy}</p>
        <p>{DISCLAIMER_CONTENT.freePolicy}</p>
      </section>

      {/* Copyright information */}
      <section className='mb-4' aria-label='版权说明'>
        <p>{DISCLAIMER_CONTENT.copyright}</p>
        <p>{DISCLAIMER_CONTENT.takedownPolicy}</p>
      </section>

      {/* License information */}
      <section className='mb-4' aria-label='开源许可'>
        <p>{LICENSE_INFO.description}</p>
        {LICENSE_INFO.licenses.map((license) => (
          <p key={license.shortName}>
            {license.scope}使用{' '}
            <a
              href={license.url}
              target='_blank'
              rel='nofollow noopener noreferrer'
              aria-label={`${license.shortName}（在新标签页打开）`}
              className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-[2px]'
            >
              {license.shortName}
            </a>{' '}
            许可证，{license.additionalDescription}。
          </p>
        ))}
      </section>

      {/* Acknowledgments */}
      <section aria-label='致谢'>
        {Object.values(DISCLAIMER_CONTENT.acknowledgements).map((ack, index) => (
          <p key={index} className={index > 0 ? 'mt-1' : undefined}>
            {ack.prefix}
            {renderCreatorLinks(ack.creators)}
            {ack.suffix}
          </p>
        ))}
      </section>
    </>
  );
};
