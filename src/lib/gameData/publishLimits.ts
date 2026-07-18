export const PUBLISH_LIMITS = Object.freeze({
  requestBytes: 1024 * 1024,
  topLevelEntries: 512,
  flattenedActions: 512,
  actionsPerRow: 128,
  pathCharacters: 256,
  messageCharacters: 1024,
} as const);
