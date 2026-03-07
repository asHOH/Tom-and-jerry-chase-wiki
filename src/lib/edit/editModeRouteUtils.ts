export function getDecodedPathSegments(pathname: string): string[] {
  return pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
}

export function getPathSegmentFromEnd(pathname: string, indexFromEnd = 0): string {
  const segments = getDecodedPathSegments(pathname);
  return segments.at(-(indexFromEnd + 1)) ?? '';
}
