import { TalkPageClient } from './TalkPageClient';

type TalkPageProps = {
  scope: string;
  targetId: string;
  entityTitle: string;
  entityTypeLabel: string;
  parentUrl: string;
};

export function TalkPage({
  scope,
  targetId,
  entityTitle,
  entityTypeLabel,
  parentUrl,
}: TalkPageProps) {
  return (
    <TalkPageClient
      scope={scope}
      targetId={targetId}
      entityTitle={entityTitle}
      entityTypeLabel={entityTypeLabel}
      parentUrl={parentUrl}
    />
  );
}
