import 'server-only';

import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import { historyData } from '@/data/history';
import { wikiHistoryData } from '@/data/wikiHistory';
import { winRatesData } from '@/data/winRates';
import { actorProfileLookup } from '@/features/actor-profiles/serialization';
import itemGroups from '@/features/items/data/itemGroups';

import {
  CHAT_CODE_MAX_LENGTH,
  executeChatCode,
  type ChatCodeExecutionContext,
} from './chatCodeExecution';

export const ECHOFLOW_EXECUTE_CODE_MAX_LENGTH = CHAT_CODE_MAX_LENGTH;

export type EchoFlowCodeExecutionResult = Readonly<{
  data: unknown;
  revision: string;
}>;

export async function executeEchoFlowCode(code: string): Promise<EchoFlowCodeExecutionResult> {
  const snapshot = await getPublishedGameDataSnapshot();
  const characterProfiles = Object.fromEntries(
    Object.keys(snapshot.data.characters).flatMap((characterId) => {
      const profile = actorProfileLookup[characterId];
      return profile ? [[characterId, profile]] : [];
    })
  );
  const executionContext = {
    ...snapshot.data,
    actorProfiles: actorProfileLookup,
    characterProfiles,
    itemGroups,
    historyData,
    wikiHistoryData,
    winRatesData,
  } satisfies ChatCodeExecutionContext;

  return {
    data: executeChatCode(code, executionContext),
    revision: snapshot.revision,
  };
}
