// Wire contract v1. Keep this file aligned with tjwiki-maps/src/sceneAnnotations.ts.
export type AnnotationPoint = { x: number; y: number };
export type AnnotationAnchor = {
  slot: string;
  variant: string;
  position: AnnotationPoint;
  source?: { skin: string; scene: string; objectId: string };
};
export type AnnotationEntry = { name: string; type: 'item' | 'entity' | 'fixture' | 'itemGroup' };
export type SceneAnnotation = {
  id: string;
  category: 'geometryBarrel' | 'idleFruitPlate' | 'scoutingCanary';
  anchor: AnnotationAnchor;
  description: string;
  relatedEntries: AnnotationEntry[];
  firecracker?: AnnotationAnchor;
  target?: AnnotationAnchor;
  countdown?: 0 | 1 | 2;
};
export type SceneAnnotations = { version: 1; points: SceneAnnotation[] };
export const emptyAnnotations = (): SceneAnnotations => ({ version: 1, points: [] });
export const annotationLabels = {
  geometryBarrel: '几何桶',
  idleFruitPlate: '挂机果盘点位',
  scoutingCanary: '侦查金丝雀',
} as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
const keys = (v: Record<string, unknown>, allowed: string[]) =>
  Object.keys(v).every((k) => allowed.includes(k));
function anchor(v: unknown): v is AnnotationAnchor {
  if (
    !record(v) ||
    !keys(v, ['slot', 'variant', 'position', 'source']) ||
    !text(v.slot, 256) ||
    !v.slot ||
    !text(v.variant, 256) ||
    !v.variant
  )
    return false;
  if (
    !record(v.position) ||
    !keys(v.position, ['x', 'y']) ||
    ![v.position.x, v.position.y].every(
      (n) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 1e6
    )
  )
    return false;
  const source = v.source;
  return (
    source === undefined ||
    (record(source) &&
      keys(source, ['skin', 'scene', 'objectId']) &&
      ['skin', 'scene', 'objectId'].every((k) => text(source[k], 256) && !!source[k]))
  );
}
export function isSceneAnnotations(value: unknown): value is SceneAnnotations {
  if (
    !record(value) ||
    !keys(value, ['version', 'points']) ||
    value.version !== 1 ||
    !Array.isArray(value.points) ||
    value.points.length > 512
  )
    return false;
  const ids = new Set<string>();
  return value.points.every((p) => {
    if (
      !record(p) ||
      !keys(p, [
        'id',
        'category',
        'anchor',
        'description',
        'relatedEntries',
        'firecracker',
        'target',
        'countdown',
      ]) ||
      typeof p.id !== 'string' ||
      !uuid.test(p.id) ||
      ids.has(p.id.toLowerCase())
    )
      return false;
    ids.add(p.id.toLowerCase());
    if (
      typeof p.category !== 'string' ||
      !Object.hasOwn(annotationLabels, p.category) ||
      !anchor(p.anchor) ||
      !text(p.description, 10000) ||
      !Array.isArray(p.relatedEntries) ||
      p.relatedEntries.length > 32
    )
      return false;
    if (
      !p.relatedEntries.every(
        (e) =>
          record(e) &&
          keys(e, ['name', 'type']) &&
          text(e.name, 128) &&
          !!e.name &&
          ['item', 'entity', 'fixture', 'itemGroup'].includes(String(e.type))
      )
    )
      return false;
    if (
      (p.target !== undefined && !anchor(p.target)) ||
      (p.firecracker !== undefined && !anchor(p.firecracker))
    )
      return false;
    if (
      p.category !== 'geometryBarrel' &&
      (p.firecracker !== undefined || p.countdown !== undefined)
    )
      return false;
    if (p.category === 'scoutingCanary' && p.target !== undefined) return false;
    return (
      p.countdown === undefined ||
      ([0, 1, 2].includes(Number(p.countdown)) && typeof p.countdown === 'number')
    );
  });
}

/** Compare JSON documents by value, independent of database object-key ordering. */
export function annotationsEqual(left: unknown, right: unknown): boolean {
  const normalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, v]) => v !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, v]) => [key, normalize(v)])
      );
    return value;
  };
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}
