it('registers the build revisions plus each runtime override, excluding the primary domain', () => {
  const original = process.env.TJWIKI_REFERENCE_BUILD_REVISIONS;
  process.env.TJWIKI_REFERENCE_BUILD_REVISIONS = JSON.stringify({
    characters: 'v1:build-characters',
    items: 'v1:build-items',
    maps: 'v1:build-maps',
  });
  try {
    jest.isolateModules(() => {
      const { packReferenceRevisions, restoreReferenceRevisions } = jest.requireActual<
        typeof import('./referenceRevisionProps')
      >('./referenceRevisionProps');
      const published = { characters: 'v1:approved-skill', maps: 'v1:build-maps' } as const;
      const overrides = packReferenceRevisions(published);
      expect(overrides).toEqual({ characters: 'v1:approved-skill' });
      expect(restoreReferenceRevisions(overrides, 'items')).toEqual(published);
    });
  } finally {
    if (original === undefined) delete process.env.TJWIKI_REFERENCE_BUILD_REVISIONS;
    else process.env.TJWIKI_REFERENCE_BUILD_REVISIONS = original;
  }
});
