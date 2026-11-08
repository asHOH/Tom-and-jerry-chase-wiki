import isEqual from 'lodash-es/isEqual';

import type { CharacterGameData } from '@/lib/dataManager';
import { applyCheckedAction } from '@/lib/gameData/checkedActionReplay';
import { cloneGameDataValue } from '@/lib/gameData/cloneGameDataValue';
import type { CharacterRelationItem } from '@/data/types';
import {
  getCharacterRelationPairLocation,
  getInverseCharacterRelationKind,
  isCharacterPairRelationKind,
  parseCharacterRelationPairPath,
} from '@/features/characters/utils/characterRelationPairs';
import {
  areCharacterRelationItemsEqual,
  migrateRetiredCharacterRelationItemTags,
} from '@/features/characters/utils/characterRelationTags';
import { getExplicitCharacterRelation } from '@/features/characters/utils/relationReadModel';

import {
  isCharacterRelationKind,
  parseCharacterRelationActionPath,
} from './characterRelationActions';
import { normalizeActionHistory, type Action, type ActionHistoryEntry } from './diffUtils';
import { getNestedProperty } from './entityUtils';

function isRelationItems(value: unknown): value is CharacterRelationItem[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  return value.every((item) => {
    if (
      item === null ||
      typeof item !== 'object' ||
      typeof item.id !== 'string' ||
      ids.has(item.id) ||
      Object.keys(item).some((key) => !['id', 'description', 'isMinor', 'tags'].includes(key)) ||
      (item.description !== undefined && typeof item.description !== 'string') ||
      typeof item.isMinor !== 'boolean' ||
      (item.tags !== undefined &&
        (!Array.isArray(item.tags) ||
          !item.tags.every(
            (tag: unknown) =>
              typeof tag === 'string' ||
              (tag !== null &&
                typeof tag === 'object' &&
                Object.keys(tag).every((key) => key === 'counters' || key === 'counteredBy') &&
                'counters' in tag &&
                typeof tag.counters === 'string' &&
                'counteredBy' in tag &&
                typeof tag.counteredBy === 'string')
          )))
    )
      return false;
    ids.add(item.id);
    return true;
  });
}

/** Convert complete relation drafts while their original before-values match. */
export function migrateLegacyCharacterRelationDrafts(
  history: ActionHistoryEntry[],
  baseline: Record<string, unknown>
): ActionHistoryEntry[] {
  const actions = history.flat();
  if (
    !actions.some((action) => {
      const relation = parseCharacterRelationActionPath(action.path);
      return relation || parseCharacterRelationPairPath(action.path);
    })
  )
    return history;

  const originalClone = cloneGameDataValue(baseline);
  const convertedClone = cloneGameDataValue(baseline);
  if (!originalClone.success || !convertedClone.success) return history;
  const original = originalClone.value as CharacterGameData;
  const converted = convertedClone.value as CharacterGameData;
  const result: ActionHistoryEntry[] = [];

  for (const entry of history) {
    const nextEntry: Action[] = [];
    for (const action of Array.isArray(entry) ? entry : [entry]) {
      // Preserve stale, indexed, or root-replacement drafts intact for the existing recovery flow.
      if (action.path.split('.').length < 2) return history;
      const relation = parseCharacterRelationActionPath(action.path);
      if (relation && isCharacterPairRelationKind(relation.relationKind)) {
        if (relation.rest.length > 0 || action.op === 'delete') return history;
        const stored = getNestedProperty(original, action.path);
        if (!isEqual(stored, action.oldValue) || (action.op === 'add' && stored !== undefined))
          return history;
        const before =
          stored === undefined
            ? getExplicitCharacterRelation(original, relation.characterId)[relation.relationKind]
            : stored;
        const after = action.newValue;
        if (!isRelationItems(before) || !isRelationItems(after)) return history;
        if (!applyCheckedAction(original, action).success) return history;

        for (const targetId of new Set([...before, ...after].map((item) => item.id))) {
          const migrate = (items: CharacterRelationItem[]) => {
            const item = items.find((item) => item.id === targetId);
            return item
              ? migrateRetiredCharacterRelationItemTags(
                  relation.characterId,
                  relation.relationKind,
                  item
                )
              : undefined;
          };
          const previous = migrate(before);
          const next = migrate(after);
          if (areCharacterRelationItemsEqual(previous, next)) continue;
          const location = getCharacterRelationPairLocation(relation.characterId, targetId);
          const sourceFaction = original[relation.characterId]?.factionId;
          const targetFaction = original[targetId]?.factionId;
          if (
            relation.characterId === targetId ||
            !Object.hasOwn(baseline, relation.characterId) ||
            !Object.hasOwn(baseline, targetId) ||
            getNestedProperty(baseline, location.path) !== undefined ||
            !sourceFaction ||
            !targetFaction ||
            (sourceFaction === 'cat' && targetFaction === 'cat') ||
            (sourceFaction === targetFaction
              ? relation.relationKind !== 'collaborators'
              : relation.relationKind === 'collaborators')
          )
            return history;
          const kind =
            location.ownerId === relation.characterId
              ? relation.relationKind
              : getInverseCharacterRelationKind(relation.relationKind);
          const oldValue = getNestedProperty(converted, location.path);
          // A later cleanup of the old kind must retain an earlier replacement kind.
          if (
            !next &&
            oldValue &&
            typeof oldValue === 'object' &&
            'kind' in oldValue &&
            oldValue.kind !== kind
          )
            continue;
          const { id: _id, ...metadata } = next ?? {};
          const pairAction: Action = {
            op: 'set',
            path: location.path,
            oldValue,
            newValue: next ? { ...metadata, kind } : null,
          };
          if (!applyCheckedAction(converted, pairAction).success) return history;
          nextEntry.push(pairAction);
        }
      } else {
        let nextAction = action;
        const pair = parseCharacterRelationPairPath(action.path);
        if (pair) {
          if (
            pair.rest.length > 0 ||
            !isEqual(getNestedProperty(original, action.path), action.oldValue)
          )
            return history;
          const oldValue = getNestedProperty(converted, action.path);
          if (!isEqual(oldValue, action.oldValue)) nextAction = { ...action, oldValue };
          if (action.op !== 'delete' && action.newValue !== null) {
            const value = action.newValue;
            if (!value || typeof value !== 'object' || Array.isArray(value)) return history;
            const { kind, ...metadata } = value as Record<string, unknown>;
            if (
              typeof kind !== 'string' ||
              !isCharacterRelationKind(kind) ||
              !isCharacterPairRelationKind(kind) ||
              Object.hasOwn(metadata, 'id')
            )
              return history;
            const items = [{ ...metadata, id: pair.otherId }];
            if (!isRelationItems(items)) return history;
            const { id: _id, ...migrated } = migrateRetiredCharacterRelationItemTags(
              pair.ownerId,
              kind,
              items[0]!
            );
            nextAction = { ...nextAction, newValue: { kind, ...migrated } };
          }
        } else if (relation) {
          const stored = getNestedProperty(original, action.path);
          if (
            relation.rest.length > 0 ||
            !isEqual(stored, action.oldValue) ||
            (action.op === 'add' && stored !== undefined)
          )
            return history;
          const oldValue = getNestedProperty(converted, action.path);
          if (!isEqual(oldValue, action.oldValue)) nextAction = { ...action, oldValue };
          if (action.op !== 'delete' && action.newValue !== undefined) {
            if (!isRelationItems(action.newValue)) return history;
            nextAction = {
              ...nextAction,
              newValue: action.newValue.map((item) =>
                migrateRetiredCharacterRelationItemTags(
                  relation.characterId,
                  relation.relationKind,
                  item
                )
              ),
            };
          }
        }
        if (
          !applyCheckedAction(original, action).success ||
          !applyCheckedAction(converted, nextAction).success
        )
          return history;
        nextEntry.push(nextAction);
      }
    }
    result.push(nextEntry.length === 1 ? nextEntry[0]! : nextEntry);
  }
  return normalizeActionHistory(result);
}
