import { isSceneAnnotations } from '@/features/maps/sceneAnnotations';

import { InvalidGameDataValueError } from './characterDataValidation';

/** Validate final values after replay, including ancestor and nested-field replacements. */
export function validateSceneAnnotationChanges(
  target: Record<string, unknown>,
  paths: readonly string[]
): void {
  const roots = new Set(
    paths
      .filter((path) => path.split('.').length === 1 || path.split('.')[1] === 'sceneAnnotations')
      .map((path) => path.split('.')[0]!)
  );
  for (const root of roots) {
    const map = target[root];
    if (!map || typeof map !== 'object' || !('sceneAnnotations' in map)) continue;
    if (!isSceneAnnotations(map.sceneAnnotations))
      throw new InvalidGameDataValueError({ path: `${root}.sceneAnnotations` });
  }
}
