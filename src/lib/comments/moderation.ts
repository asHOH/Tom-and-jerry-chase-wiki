export async function shouldAllowComment(_args: {
  scope: 'articles';
  targetId: string;
  content: string;
  parentId?: string;
}): Promise<boolean> {
  // Placeholder for async moderation / auto-hide.
  // For now: always allow (comment is OK).
  return true;
}
