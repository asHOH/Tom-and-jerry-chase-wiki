import { useMemo } from 'react';

import { getHistory } from '@/lib/historyUtils';

import CharacterHistoryDisplay from './CharacterHistoryDisplay';

/** Only local drafts and changed history names need the full timeline in the browser. */
export default function LocalCharacterHistoryDisplay({ names }: { names: readonly string[] }) {
  const history = useMemo(() => getHistory([...names]), [names]);
  return <CharacterHistoryDisplay history={history} />;
}
