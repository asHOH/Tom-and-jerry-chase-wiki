export type ModerationAction = 'approve' | 'reject' | 'revoke';

type ModerationErrorResponse = {
  error: string;
  status: 403 | 404 | 409;
};

export function mapModerationActionError(
  action: ModerationAction,
  message: string
): ModerationErrorResponse | null {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('insufficient permissions')) {
    return {
      error: 'Insufficient permissions to perform this action',
      status: 403,
    };
  }

  if (
    (action === 'approve' || action === 'reject') &&
    normalizedMessage.includes('not in pending status')
  ) {
    return {
      error: 'Article version is no longer pending. Please refresh the moderation queue.',
      status: 409,
    };
  }

  if (normalizedMessage.includes('incomplete metadata snapshot')) {
    return {
      error:
        action === 'revoke'
          ? 'This version cannot be revoked because the preceding legacy version has no complete metadata snapshot.'
          : 'This legacy article version cannot be published because its metadata snapshot is incomplete.',
      status: 409,
    };
  }

  if (normalizedMessage.includes('not found')) {
    return {
      error: `Article version not found or not in the correct status for ${action}`,
      status: 404,
    };
  }

  return null;
}
