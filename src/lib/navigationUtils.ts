const getDocumentNavigationPath = (targetPath: string) => {
  if (!targetPath.startsWith('/') || targetPath.startsWith('//') || targetPath === '/') {
    return targetPath;
  }

  const suffixIndex = targetPath.search(/[?#]/);
  const pathname = suffixIndex === -1 ? targetPath : targetPath.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? '' : targetPath.slice(suffixIndex);

  return pathname.endsWith('/') ? targetPath : `${pathname}/${suffix}`;
};

/**
 * Use client navigation while online and document navigation while offline.
 * The document request lets the service worker resolve its own caches or offline fallback.
 * @param targetPath - The path to navigate to
 * @param navigateClient - The client navigation function (e.g., router.push)
 * @param navigateDocument - The document navigation function (e.g., window.location.assign)
 */
export const navigate = (
  targetPath: string,
  navigateClient: (path: string) => void,
  navigateDocument: (path: string) => void
): void => {
  if (navigator.onLine) {
    navigateClient(targetPath);
    return;
  }

  navigateDocument(getDocumentNavigationPath(targetPath));
};
