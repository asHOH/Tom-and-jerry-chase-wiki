// Utility for recording and replaying history of the characters object using jsondiffpatch

import { characters } from '@/data';
import { CharacterWithFaction } from './types';
import * as jsondiffpatch from 'jsondiffpatch';
import { GameDataManager } from './dataManager';

// Internal state
type Delta = Parameters<typeof jsondiffpatch.patch>[1];
let historyArray: Delta[] = [];
let prevCharacters: Record<string, CharacterWithFaction> = GameDataManager.getCharacters();
const initialCharacters: Record<string, CharacterWithFaction> = GameDataManager.getCharacters();

// Create a jsondiffpatch instance
const diffpatcher = jsondiffpatch.create({
  // You can customize options here if needed
});

/**
 * Convert a valtio proxy or any object to a plain object for diffing.
 */
function toPlainObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Initialize or reset the history utility.
 * Sets the initial state and clears history.
 * Accepts valtio proxy or plain object.
 */
export function reset() {
  prevCharacters = GameDataManager.getCharacters();
  historyArray = [];
}

/**
 * Record the diff between the previous and current characters.
 * Pushes the delta to historyArray if there is a change.
 */
export function recordHistory() {
  const plain = toPlainObject(characters);
  const delta = diffpatcher.diff(prevCharacters, plain);
  if (delta) {
    historyArray.push(delta);
    prevCharacters = plain;
  }
}

/**
 * Apply all deltas in historyArray to initialCharacters.
 * Returns the latest state.
 */
export function applyHistory(
  newHistoryArray: Delta[]
): Record<string, CharacterWithFaction> | null {
  if (!initialCharacters) return null;
  const state = JSON.parse(JSON.stringify(initialCharacters));
  for (const delta of newHistoryArray) {
    diffpatcher.patch(state, delta);
  }
  historyArray.push(...newHistoryArray);
  return state;
}

/**
 * Get a copy of the current history array.
 */
export function getHistory(): Delta[] {
  return JSON.parse(JSON.stringify(historyArray));
}

/**
 * Get a copy of the current previous characters snapshot.
 */
export function getPrevCharacters(): Record<string, CharacterWithFaction> {
  return JSON.parse(JSON.stringify(prevCharacters));
}
