import { CREATORS, DISCLAIMER_CONTENT } from '@/constants';

export const DisclaimerText = () => {
  // Helper function to render creator links
  const renderCreatorLinks = (creatorIds: readonly string[]) => {
    return creatorIds.map((creatorId, index) => (
      <span key={creatorId}>
        {index > 0 && '、'}
        <a
          href={CREATORS[creatorId as keyof typeof CREATORS].url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline mx-1"
        >
          {CREATORS[creatorId as keyof typeof CREATORS].name}
        </a>
      </span>
    ));
  };

  return (
    <>
      {DISCLAIMER_CONTENT.intro}
      <br />
      {DISCLAIMER_CONTENT.copyright}
      <br />
      {DISCLAIMER_CONTENT.testDataAttribution.prefix}
      {renderCreatorLinks(DISCLAIMER_CONTENT.testDataAttribution.creators)}
      {DISCLAIMER_CONTENT.testDataAttribution.suffix}
      <br />
      {DISCLAIMER_CONTENT.imageAttribution.prefix}
      {renderCreatorLinks(DISCLAIMER_CONTENT.imageAttribution.creators)}
      {DISCLAIMER_CONTENT.imageAttribution.suffix}
    </>
  );
};
