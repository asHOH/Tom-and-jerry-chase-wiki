import { CREATORS, DISCLAIMER_CONTENT, PROJECT_INFO } from '@/constants';

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
            className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline mx-1 whitespace-pre-wrap'
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
      <span className='block mb-4'>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: '0.5rem 0',
          }}
        >
          <svg
            style={{ width: '1.25rem', height: '1.25rem', color: '#374151' }}
            fill='currentColor'
            viewBox='0 0 20 20'
            xmlns='http://www.w3.org/2000/svg'
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
            rel='noopener noreferrer'
            className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium'
          >
            {PROJECT_INFO.name}
          </a>
        </span>
        <br />
        <span>
          本项目由{renderCreatorLinks([PROJECT_INFO.maintainerId])}维护，
          {PROJECT_INFO.descriptionParts.before}
          {onFeedbackClick ? (
            <button
              type='button'
              onClick={onFeedbackClick}
              className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer bg-transparent border-none p-0 font-inherit'
            >
              {PROJECT_INFO.descriptionParts.feedbackLink}
            </button>
          ) : (
            PROJECT_INFO.descriptionParts.feedbackLink
          )}
          {PROJECT_INFO.descriptionParts.after}
        </span>
      </span>
      {/* Website nature and commitments */}
      <span className='block mb-4'>
        {DISCLAIMER_CONTENT.intro}
        <br />
        {DISCLAIMER_CONTENT.privacyPolicy}
        <br />
        {DISCLAIMER_CONTENT.freePolicy}
        <br />
      </span>

      {/* Copyright information */}
      <span className='block mb-4'>
        {DISCLAIMER_CONTENT.copyright}
        <br />
        {DISCLAIMER_CONTENT.takedownPolicy}
      </span>

      {/* Acknowledgments */}
      <span className='block'>
        {Object.values(DISCLAIMER_CONTENT.acknowledgements).map((ack, index) => (
          <span key={index}>
            {index > 0 && <br />}
            {ack.prefix}
            {renderCreatorLinks(ack.creators)}
            {ack.suffix}
          </span>
        ))}
      </span>
    </>
  );
};
