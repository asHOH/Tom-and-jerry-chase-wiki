import 'server-only';

import { Buffer } from 'node:buffer';
import { VM, type VMOptions } from 'vm2';

import type { ChatGameData } from '@/lib/gameData/chatGameData';
import type { GameHistory, ItemGroup } from '@/data/types';
import type { ActorProfileLookup } from '@/features/actor-profiles/serialization';

export const CHAT_CODE_MAX_LENGTH = 8 * 1024;

const CHAT_CODE_TIMEOUT_MS = 1000;
const CHAT_CODE_BUFFER_ALLOC_LIMIT = 8 * 1024 * 1024;
const CHAT_CODE_MAX_OUTPUT_BYTES = 32 * 1024;

type HardenedVMOptions = VMOptions & {
  bufferAllocLimit: number;
};

export type ChatCodeExecutionContext = ChatGameData & {
  readonly actorProfiles: ActorProfileLookup;
  readonly characterProfiles?: ActorProfileLookup;
  readonly itemGroups: Readonly<Record<string, ItemGroup>>;
  readonly historyData: GameHistory;
  readonly wikiHistoryData?: unknown;
  readonly winRatesData?: unknown;
};

type ChatCodeExecutionError = Readonly<{
  error: string;
  details: string;
}>;

function executionError(error: string, details: string): ChatCodeExecutionError {
  return { error, details };
}

export function executeChatCode(code: string, context: ChatCodeExecutionContext): unknown {
  if (Buffer.byteLength(code, 'utf8') > CHAT_CODE_MAX_LENGTH) {
    return executionError(
      'Code execution rejected',
      `Code must not exceed ${CHAT_CODE_MAX_LENGTH} bytes.`
    );
  }

  const vmOptions: HardenedVMOptions = {
    timeout: CHAT_CODE_TIMEOUT_MS,
    allowAsync: false,
    eval: false,
    wasm: false,
    bufferAllocLimit: CHAT_CODE_BUFFER_ALLOC_LIMIT,
  };
  const vm = new VM(vmOptions);

  for (const [name, value] of Object.entries(context)) {
    vm.freeze(value, name);
  }

  let serialized: unknown;
  try {
    serialized = vm.run(
      `(function () {
'use strict';
const result = (function () {
${code}
})();
if (
  result !== null &&
  (typeof result === 'object' || typeof result === 'function') &&
  typeof result.then === 'function'
) {
  throw new Error('Async results are not supported.');
}
return JSON.stringify(result);
})()`,
      { filename: 'ai-chat-tool.vm.js' }
    );
  } catch {
    return executionError(
      'Code execution failed',
      `Execution failed or exceeded the ${CHAT_CODE_TIMEOUT_MS}ms limit.`
    );
  }

  if (serialized === undefined) return null;
  if (typeof serialized !== 'string') {
    return executionError('Code execution failed', 'Execution returned an invalid result.');
  }
  if (Buffer.byteLength(serialized, 'utf8') > CHAT_CODE_MAX_OUTPUT_BYTES) {
    return executionError(
      'Code execution output too large',
      `Serialized output must not exceed ${CHAT_CODE_MAX_OUTPUT_BYTES} bytes.`
    );
  }

  try {
    return JSON.parse(serialized) as unknown;
  } catch {
    return executionError('Code execution failed', 'Execution returned invalid serialized data.');
  }
}
