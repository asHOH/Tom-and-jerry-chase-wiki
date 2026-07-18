import { cloneGameDataValue } from '@/lib/gameData/cloneGameDataValue';

export class PublishedGameDataCloneError extends TypeError {
  readonly detail: {
    code: 'clone_failed';
    rootKey: string;
  };

  constructor(rootKey: string) {
    super(`Canonical game-data branch ${rootKey} is not cloneable`);
    this.name = 'PublishedGameDataCloneError';
    this.detail = Object.freeze({ code: 'clone_failed', rootKey });
  }
}

export function prepareCopyOnWriteRoot(
  canonicalRoot: Readonly<Record<string, unknown>>,
  touchedRootKeys: readonly string[]
): Record<string, unknown> {
  const workingRoot: Record<string, unknown> = { ...canonicalRoot };

  for (const rootKey of touchedRootKeys) {
    if (!Object.prototype.hasOwnProperty.call(canonicalRoot, rootKey)) continue;

    const cloned = cloneGameDataValue(canonicalRoot[rootKey]);
    if (!cloned.success) throw new PublishedGameDataCloneError(rootKey);
    workingRoot[rootKey] = cloned.value;
  }

  return workingRoot;
}
