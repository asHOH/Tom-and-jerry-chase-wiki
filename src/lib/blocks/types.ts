export const BLOCK_ACTIONS = ['edit', 'upload', 'create_account', 'email'] as const;

export type BlockAction = (typeof BLOCK_ACTIONS)[number];

export type BlockResourceContext = {
  resourceType?: string;
  resourceId?: string;
};

export type BlockInfo = {
  id: string;
  reason: string;
  expiresAt: string | null;
  isAutoblock: boolean;
  targetType: string;
  hardBlock: boolean;
  parentBlockId: string | null;
  action: BlockAction;
  resourceType: string | null;
  resourceId: string | null;
};

export type BlockRestrictionInput = {
  action: BlockAction;
  resourceType: string | null;
  resourceId: string | null;
};

export type BlockedUserSummary = {
  action: BlockAction;
  reason: string;
  expiresAt: string | null;
  isAutoblock: boolean;
  blockId: string;
};

export const isValidBlockAction = (value: string): value is BlockAction =>
  (BLOCK_ACTIONS as readonly string[]).includes(value);
