import 'server-only';

import { Buffer } from 'node:buffer';
import { execFile } from 'node:child_process';
import path from 'node:path';

import type { ChatGameData } from '@/lib/gameData/chatGameData';
import type { GameHistory, ItemGroup } from '@/data/types';
import type { ActorProfileLookup } from '@/features/actor-profiles/serialization';

export const CHAT_CODE_MAX_LENGTH = 8 * 1024;

const CHAT_CODE_PROCESS_TIMEOUT_MS = 5000;
const CHAT_CODE_MAX_INPUT_BYTES = 16 * 1024 * 1024;
const CHAT_CODE_MAX_OUTPUT_BYTES = 32 * 1024;
let executionActive = false;

export type ChatCodeExecutionContext = ChatGameData & {
  readonly references?: readonly unknown[];
  readonly actorProfiles: ActorProfileLookup;
  readonly itemGroups: Readonly<Record<string, ItemGroup>>;
  readonly historyData: GameHistory;
};

type ChatCodeExecutionError = Readonly<{
  error: string;
  details: string;
}>;

function executionError(error: string, details: string): ChatCodeExecutionError {
  return { error, details };
}

export async function executeChatCode(
  code: string,
  context: ChatCodeExecutionContext,
  signal?: AbortSignal
): Promise<unknown> {
  signal?.throwIfAborted();
  if (Buffer.byteLength(code, 'utf8') > CHAT_CODE_MAX_LENGTH) {
    return executionError(
      'Code execution rejected',
      `Code must not exceed ${CHAT_CODE_MAX_LENGTH} bytes.`
    );
  }

  if (executionActive) {
    return executionError('Code execution busy', 'Another query is running. Please try again.');
  }

  let input: string;
  try {
    input = JSON.stringify({ code, context });
  } catch {
    return executionError('Code execution rejected', 'Game data could not be serialized.');
  }
  if (Buffer.byteLength(input, 'utf8') > CHAT_CODE_MAX_INPUT_BYTES) {
    return executionError(
      'Code execution rejected',
      'Game data exceeds the execution input limit.'
    );
  }
  executionActive = true;
  return new Promise((resolve, reject) => {
    try {
      const child = execFile(
        process.execPath,
        ['--max-old-space-size=128', path.join(process.cwd(), 'src/lib/ai/chatCodeRunner.cjs')],
        {
          timeout: CHAT_CODE_PROCESS_TIMEOUT_MS,
          killSignal: 'SIGKILL',
          maxBuffer: CHAT_CODE_MAX_OUTPUT_BYTES,
          encoding: 'utf8',
          windowsHide: true,
          // shortcut: use an OS sandbox if hostile access or total memory must be contained.
          env: {
            NODE_ENV: 'production',
            ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot } : {}),
          },
          ...(signal ? { signal } : {}),
        },
        (error, stdout) => {
          if (signal?.aborted) {
            reject(signal.reason);
          } else if (error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
            resolve(
              executionError(
                'Code execution output too large',
                `Serialized output must not exceed ${CHAT_CODE_MAX_OUTPUT_BYTES} bytes.`
              )
            );
          } else if (error) {
            resolve(
              executionError('Code execution failed', 'Executor stopped or exceeded its deadline.')
            );
          } else {
            try {
              resolve(JSON.parse(stdout) as unknown);
            } catch {
              resolve(
                executionError(
                  'Code execution failed',
                  'Execution returned invalid serialized data.'
                )
              );
            }
          }
        }
      );
      // Abort can invoke the callback before the process has actually exited.
      child.once('close', () => {
        executionActive = false;
      });
      child.stdin?.on('error', () => {
        // An early exit can close stdin while the snapshot is still being written.
        child.kill('SIGKILL');
      });
      child.stdin?.end(input);
    } catch {
      executionActive = false;
      resolve(executionError('Code execution failed', 'Executor could not be started.'));
    }
  });
}
