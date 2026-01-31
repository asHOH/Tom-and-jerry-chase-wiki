import { PROJECT_STATEMENT_COPY } from '@/data/projectStatement';
import CollapseCard from '@/components/ui/CollapseCard';
import { InlineExternalLink } from '@/components/ui/InlineExternalLink';
import Tooltip from '@/components/ui/Tooltip';
import { CREATORS, DISCLAIMER_CONTENT, LICENSE_INFO, PROJECT_INFO } from '@/constants';

interface ProjectStatementProps {
  onFeedbackClick?: () => void;
}

const creatorSeparator = PROJECT_STATEMENT_COPY.creatorSeparator;

// Helper function to render creator links (module scope to keep it stable across renders)
const renderCreatorLinks = (creatorIds: readonly string[]) => {
  return creatorIds.map((creatorId, index) => {
    const creator = CREATORS[creatorId];
    const displayName = creator?.name ?? creatorId;

    return (
      <span key={creatorId}>
        {index > 0 && creatorSeparator}
        {creator?.url ? (
          <InlineExternalLink
            href={creator.url}
            ariaLabel={`${displayName}（在新标签页打开）`}
            className='whitespace-pre-wrap'
          >
            {displayName}
          </InlineExternalLink>
        ) : (
          <span className='whitespace-pre-wrap text-gray-700 dark:text-gray-300'>
            {displayName}
          </span>
        )}
      </span>
    );
  });
};

export const ProjectStatement = ({ onFeedbackClick }: ProjectStatementProps) => {
  const { projectInfo, acknowledgements, legal } = PROJECT_STATEMENT_COPY;

  return (
    <div className='space-y-4 text-left'>
      {/* Project information (inline repo link + icon, readable sentence) */}
      <section aria-label={projectInfo.ariaLabel}>
        <p className='text-gray-700 dark:text-gray-300'>
          {projectInfo.maintainerPrefix}
          {renderCreatorLinks([PROJECT_INFO.maintainerId])}
          {projectInfo.maintainerSuffix}
          {projectInfo.description.beforeRepoLink}
          <InlineExternalLink
            href={PROJECT_INFO.url}
            ariaLabel={`${PROJECT_INFO.title}（在新标签页打开）`}
            className='inline-flex -translate-y-[2px] items-center gap-1 align-middle font-medium'
          >
            <svg
              className='h-4 w-4'
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
            <span>{projectInfo.repoLinkLabel}</span>
          </InlineExternalLink>
          {projectInfo.description.afterRepoLink}
          {onFeedbackClick ? (
            <button
              type='button'
              onClick={onFeedbackClick}
              className='font-inherit cursor-pointer rounded-[2px] border-none bg-transparent p-0 text-blue-600 underline hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:text-blue-400 dark:hover:text-blue-300'
            >
              {projectInfo.description.feedbackLinkText}
            </button>
          ) : (
            projectInfo.description.feedbackLinkText
          )}
          {projectInfo.description.afterFeedback}
        </p>
        <p className='mt-2 text-gray-700 dark:text-gray-300'>{DISCLAIMER_CONTENT.intro}</p>
        <p className='mt-2 text-gray-700 dark:text-gray-300'>{DISCLAIMER_CONTENT.policy}</p>
      </section>

      {/* Acknowledgments */}
      <CollapseCard
        title={acknowledgements.title}
        size='xs'
        className='p-4 text-sm text-gray-700 dark:text-gray-300'
      >
        <section aria-label={acknowledgements.ariaLabel}>
          <h3 className='sr-only'>{acknowledgements.title}</h3>
          {Object.values(DISCLAIMER_CONTENT.acknowledgements).map((ack, index) => (
            <p key={index} className={index > 0 ? 'mt-2' : undefined}>
              {ack.prefix}
              {renderCreatorLinks(ack.creators)}
              {ack.suffix}
            </p>
          ))}
        </section>
      </CollapseCard>

      {/* Real Disclaimers & Licenses */}
      <CollapseCard
        title={legal.title}
        size='xs'
        className='p-4 text-sm text-gray-700 dark:text-gray-300'
      >
        <div className='space-y-4'>
          <h3 className='sr-only'>{legal.title}</h3>
          {/* Copyright information */}
          <section aria-label={legal.copyright.ariaLabel} className='leading-6'>
            <h4 className='sr-only'>{legal.headings.copyright}</h4>
            <p>
              <Tooltip content={legal.copyright.brandTooltip}>{legal.copyright.brandLabel}</Tooltip>
              {legal.copyright.textPrefix}
              <Tooltip content={legal.copyright.ownerTooltip}>华纳兄弟娱乐公司</Tooltip>
              {legal.copyright.textSuffix}
            </p>
            <p className='mt-1'>{DISCLAIMER_CONTENT.takedownPolicy}</p>
          </section>

          {/* License information */}
          <section aria-label={legal.license.ariaLabel} className='leading-6'>
            <h4 className='sr-only'>{legal.headings.license}</h4>
            <p>{LICENSE_INFO.description}</p>
            {LICENSE_INFO.licenses.map((license) => (
              <p key={license.shortName} className='mt-1'>
                {license.scope}使用{' '}
                <InlineExternalLink
                  href={license.url}
                  ariaLabel={`${license.shortName}（在新标签页打开）`}
                >
                  {license.shortName}
                </InlineExternalLink>
                {legal.license.linkSuffix}
                {license.additionalDescription}
                {legal.license.sentenceSuffix}
              </p>
            ))}
          </section>
        </div>
      </CollapseCard>
    </div>
  );
};
