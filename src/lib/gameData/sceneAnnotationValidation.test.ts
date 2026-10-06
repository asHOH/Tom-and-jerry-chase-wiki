import type { Action } from '@/lib/edit/diffUtils';
import { emptyAnnotations, isSceneAnnotations } from '@/features/maps/sceneAnnotations';

import { StaleGameDataEditError, validateActionFreshness } from './actionFreshness';
import {
  validateApprovedCandidateReplay,
  type ApprovedCandidateReplayRow,
} from './approvedCandidateReplay';
import { InvalidGameDataValueError } from './characterDataValidation';
import { getCanonicalGameData } from './published/canonicalSources';
import { validateSceneAnnotationChanges } from './sceneAnnotationValidation';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('./published/canonicalSources', () => ({ getCanonicalGameData: jest.fn() }));
const annotation = {
  version: 1,
  points: [
    {
      id: '7d1de34f-8b75-4aa7-8d43-9138195bca94',
      category: 'geometryBarrel',
      anchor: { slot: 'woshi_room', variant: 'woshi2', position: { x: 1, y: 2 } },
      description: 'user annotation',
      relatedEntries: [],
      countdown: 0,
    },
  ],
};
const row = (
  entry: Omit<Action, 'oldValue'> & { oldValue?: unknown }
): ApprovedCandidateReplayRow => ({
  rowId: 'annotation',
  entityType: 'maps',
  actions: [{ ...entry, oldValue: entry.oldValue }],
});
beforeEach(() =>
  jest
    .mocked(getCanonicalGameData)
    .mockImplementation(
      (type) => (type === 'maps' ? { 经典之家I: { name: '经典之家I' } } : {}) as never
    )
);
it('accepts new annotation documents and rejects invalid final values from generic submissions', () => {
  expect(() =>
    validateActionFreshness(
      [],
      [row({ op: 'add', path: '经典之家I.sceneAnnotations', newValue: annotation })]
    )
  ).not.toThrow();
  expect(() =>
    validateActionFreshness(
      [],
      [
        row({
          op: 'add',
          path: '经典之家I.sceneAnnotations',
          newValue: { ...annotation, version: 2 },
        }),
      ]
    )
  ).toThrow(InvalidGameDataValueError);
});
it('rejects invalid documents in the moderation/public-candidate replay path', () => {
  expect(() =>
    validateApprovedCandidateReplay([
      row({ op: 'add', path: '经典之家I.sceneAnnotations', newValue: annotation }),
    ])
  ).not.toThrow();
  expect(() =>
    validateApprovedCandidateReplay([
      row({
        op: 'add',
        path: '经典之家I.sceneAnnotations',
        newValue: { ...annotation, points: [...annotation.points, ...annotation.points] },
      }),
    ])
  ).toThrow(InvalidGameDataValueError);
});
it('validates ancestor and nested replacements without rejecting unrelated legacy fields', () => {
  expect(() =>
    validateSceneAnnotationChanges(
      { 经典之家I: { sceneAnnotations: { version: 2, points: [] } } },
      ['经典之家I']
    )
  ).toThrow();
  expect(() =>
    validateSceneAnnotationChanges(
      { 经典之家I: { sceneAnnotations: { version: 2, points: [] } } },
      ['经典之家I.sceneAnnotations.version']
    )
  ).toThrow();
  expect(() =>
    validateSceneAnnotationChanges({ 经典之家I: { interactiveMap: { old: 'preserved' } } }, [
      '经典之家I.description',
    ])
  ).not.toThrow();
});
it('retains before-values for conflicting edits and rejects unchanged rows', () => {
  const published = row({ op: 'add', path: '经典之家I.sceneAnnotations', newValue: annotation });
  expect(() =>
    validateActionFreshness(
      [published],
      [
        row({
          op: 'set',
          path: '经典之家I.sceneAnnotations',
          oldValue: emptyAnnotations(),
          newValue: annotation,
        }),
      ]
    )
  ).toThrow(StaleGameDataEditError);
  expect(() =>
    validateActionFreshness(
      [published],
      [
        row({
          op: 'set',
          path: '经典之家I.sceneAnnotations',
          oldValue: annotation,
          newValue: annotation,
        }),
      ]
    )
  ).toThrow(InvalidGameDataValueError);
});
it('rejects nonfinite positions, unsupported target shapes and invalid countdowns', () => {
  for (const changes of [
    { countdown: 3 },
    { anchor: { slot: 'a', variant: 'b', position: { x: Infinity, y: 2 } } },
    { target: { slot: 'a' } },
    { category: 'scoutingCanary', firecracker: annotation.points[0]!.anchor },
  ])
    expect(
      isSceneAnnotations({ ...annotation, points: [{ ...annotation.points[0], ...changes }] })
    ).toBe(false);
});

it('rejects UUID duplicates even when their letter case differs', () => {
  expect(
    isSceneAnnotations({
      ...annotation,
      points: [
        annotation.points[0],
        { ...annotation.points[0], id: annotation.points[0]!.id.toUpperCase() },
      ],
    })
  ).toBe(false);
});
