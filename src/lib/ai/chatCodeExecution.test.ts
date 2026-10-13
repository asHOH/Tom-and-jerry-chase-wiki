/** @jest-environment node */

import childProcess from 'node:child_process';
import { once } from 'node:events';
import { setImmediate as nextTurn } from 'node:timers/promises';

import { getCanonicalGameData } from '@/lib/gameData/published/canonicalSources';
import { historyData } from '@/data/history';
import { actorProfileLookup } from '@/features/actor-profiles/serialization';

import { executeChatCode, type ChatCodeExecutionContext } from './chatCodeExecution';

jest.mock('server-only', () => ({}), { virtual: true });

const context: ChatCodeExecutionContext = {
  characters: {},
  cards: {},
  specialSkills: { cat: {}, mouse: {} },
  items: {},
  entities: {},
  buffs: {},
  actorProfiles: {},
  itemGroups: {},
  historyData: [],
};

const realExecFile = childProcess.execFile;

beforeEach(() => {
  jest.spyOn(childProcess, 'execFile');
});

afterEach(async () => {
  // Jest's own test deadline does not terminate a child if the production timeout breaks.
  await Promise.all(
    jest.mocked(childProcess.execFile).mock.results.map((result) => {
      if (result.type !== 'return') return;
      const child = result.value;
      if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
      return new Promise<void>((resolve) => {
        child.once('close', () => resolve());
        child.kill('SIGKILL');
      });
    })
  );
});

// Keep real process/pipe/timeout behavior while simulating a broken runner.
function replaceRunner(script: string) {
  return jest
    .spyOn(childProcess, 'execFile')
    .mockImplementationOnce(((
      file: string,
      _args: readonly string[],
      options: childProcess.ExecFileOptionsWithStringEncoding,
      callback: (
        error: childProcess.ExecFileException | null,
        stdout: string,
        stderr: string
      ) => void
    ) => realExecFile(file, ['-e', script], options, callback)) as typeof childProcess.execFile);
}

test('queries the actual baseline snapshot in a subprocess', async () => {
  const snapshot = {
    ...context,
    ...Object.fromEntries(
      (['characters', 'cards', 'specialSkills', 'items', 'entities', 'buffs'] as const).map(
        (name) => [name, getCanonicalGameData(name)]
      )
    ),
    actorProfiles: actorProfileLookup,
    historyData,
  };
  await expect(executeChatCode('return Object.keys(characters);', snapshot)).resolves.toEqual(
    Object.keys(getCanonicalGameData('characters'))
  );
});

test.each([
  'return Promise.resolve(1);',
  'return eval("1");',
  'return process.env;',
  'return require("node:fs");',
  'items.newItem = {}; return items;',
  'return Buffer.alloc(9 * 1024 * 1024);',
])('preserves sandbox restrictions: %s', async (code) => {
  await expect(executeChatCode(code, context)).resolves.toMatchObject({
    error: 'Code execution failed',
  });
});

test('handles undefined and Unicode results', async () => {
  await expect(executeChatCode('return undefined;', context)).resolves.toBeNull();
  await expect(executeChatCode('return { name: "汤姆" };', context)).resolves.toEqual({
    name: '汤姆',
  });
});

test('bounds code bytes and output bytes, then accepts another query', async () => {
  await expect(executeChatCode('// ' + '猫'.repeat(3000), context)).resolves.toMatchObject({
    error: 'Code execution rejected',
  });
  await expect(executeChatCode('return "猫".repeat(12000);', context)).resolves.toMatchObject({
    error: 'Code execution output too large',
  });
  await expect(executeChatCode('return 1;', context)).resolves.toBe(1);
});

test('contains a VM hang without blocking the parent or queueing overlapping work', async () => {
  let completed = false;
  const pending = executeChatCode('while (true) {}', context).then((result) => {
    completed = true;
    return result;
  });
  await nextTurn();
  expect(completed).toBe(false);
  await expect(executeChatCode('return 2;', context)).resolves.toMatchObject({
    error: 'Code execution busy',
  });
  await expect(pending).resolves.toMatchObject({ error: 'Code execution failed' });
  await expect(executeChatCode('return 3;', context)).resolves.toBe(3);
});

test('kills a runner that hangs outside vm2, then recovers', async () => {
  replaceRunner('while (true) {}');
  await expect(executeChatCode('return 1;', context)).resolves.toMatchObject({
    error: 'Code execution failed',
  });
  await expect(executeChatCode('return 2;', context)).resolves.toBe(2);
}, 15000);

test.each(['process.exit(1)', 'process.stdout.end("not JSON")'])(
  'contains runner failures and releases the slot: %s',
  async (script) => {
    replaceRunner(script);
    await expect(executeChatCode('return 1;', context)).resolves.toMatchObject({
      error: 'Code execution failed',
    });
    await expect(executeChatCode('return 2;', context)).resolves.toBe(2);
  }
);

test('does not start work for an already cancelled request', async () => {
  const spawn = jest.spyOn(childProcess, 'execFile');
  const controller = new AbortController();
  controller.abort();
  await expect(executeChatCode('return 1;', context, controller.signal)).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(spawn).not.toHaveBeenCalled();
});

test('kills a cancelled child and recovers once it closes', async () => {
  const spawn = jest.spyOn(childProcess, 'execFile');
  const controller = new AbortController();
  const pending = executeChatCode('while (true) {}', context, controller.signal);
  const child = spawn.mock.results[0]!.value as childProcess.ChildProcess;
  const closed = new Promise<void>((resolve) => child.once('close', () => resolve()));
  await once(child, 'spawn');
  const rejection = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  controller.abort();
  await rejection;
  await closed;
  await expect(executeChatCode('return 2;', context)).resolves.toBe(2);
});

test('does not inherit application secrets or Node startup options', async () => {
  replaceRunner('process.stdout.end(JSON.stringify(process.env))');
  const previous = process.env.CHAT_TEST_SECRET;
  const previousNodeOptions = process.env.NODE_OPTIONS;
  process.env.CHAT_TEST_SECRET = 'must-not-reach-runner';
  process.env.NODE_OPTIONS = '--no-warnings';
  try {
    const result = await executeChatCode('return 1;', context);
    expect(result).toHaveProperty('NODE_ENV', 'production');
    expect(result).not.toHaveProperty('CHAT_TEST_SECRET');
    expect(result).not.toHaveProperty('NODE_OPTIONS');
  } finally {
    if (previous === undefined) delete process.env.CHAT_TEST_SECRET;
    else process.env.CHAT_TEST_SECRET = previous;
    if (previousNodeOptions === undefined) delete process.env.NODE_OPTIONS;
    else process.env.NODE_OPTIONS = previousNodeOptions;
  }
});
