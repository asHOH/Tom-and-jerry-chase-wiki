export async function shouldAllowComment(_args: {
  scope: string;
  targetId: string;
  content: string;
  parentId?: string;
  title?: string;
}): Promise<boolean> {
  // Placeholder for async moderation / auto-hide.
  // For now: always allow (comment is OK).
  return true;
}
