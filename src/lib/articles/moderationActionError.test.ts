import { mapModerationActionError } from './moderationActionError';

describe('mapModerationActionError', () => {
  it('maps insufficient permissions to 403', () => {
    expect(
      mapModerationActionError('approve', 'Insufficient permissions to approve article')
    ).toEqual({
      error: 'Insufficient permissions to perform this action',
      status: 403,
    });
  });

  it('maps stale approve/reject status to 409', () => {
    expect(
      mapModerationActionError('approve', 'Article version not found or not in pending status')
    ).toEqual({
      error: 'Article version is no longer pending. Please refresh the moderation queue.',
      status: 409,
    });

    expect(mapModerationActionError('reject', 'Article version not in pending status')).toEqual({
      error: 'Article version is no longer pending. Please refresh the moderation queue.',
      status: 409,
    });
  });

  it('maps not found errors to 404', () => {
    expect(mapModerationActionError('revoke', 'Article version not found')).toEqual({
      error: 'Article version not found or not in the correct status for revoke',
      status: 404,
    });
  });

  it('returns null for unknown errors', () => {
    expect(mapModerationActionError('approve', 'unexpected error')).toBeNull();
  });
});
