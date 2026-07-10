import { TalkPageClient } from './TalkPageClient';

type TalkPageProps = {
  scope: string;
  targetId: string;
  entityTitle: string;
};

export function TalkPage({ scope, targetId, entityTitle }: TalkPageProps) {
  return <TalkPageClient scope={scope} targetId={targetId} entityTitle={entityTitle} />;
}
