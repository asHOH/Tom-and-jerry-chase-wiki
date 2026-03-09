import { buildEditSourcePolicy, resolveEditFormState } from './editSources';

describe('buildEditSourcePolicy', () => {
  it('enables source picker when own pending is newer than approved', () => {
    const approved = {
      version_id: 'approved-v1',
      title: 'A',
      category_id: 'cat-a',
      character_id: null,
      content: 'approved',
      created_at: '2026-01-01T00:00:00.000Z',
    };
    const pending = {
      version_id: 'pending-v1',
      title: 'B',
      category_id: 'cat-b',
      character_id: 'Tom',
      content: 'pending',
      created_at: '2026-01-02T00:00:00.000Z',
    };

    expect(buildEditSourcePolicy(approved, pending)).toEqual({
      show_source_picker: true,
      default_source: 'pending_mine',
      will_override_pending: true,
    });
  });

  it('disables source picker when pending is not newer', () => {
    const approved = {
      version_id: 'approved-v1',
      title: 'A',
      category_id: 'cat-a',
      character_id: null,
      content: 'approved',
      created_at: '2026-01-02T00:00:00.000Z',
    };
    const pending = {
      version_id: 'pending-v1',
      title: 'B',
      category_id: 'cat-b',
      character_id: 'Tom',
      content: 'pending',
      created_at: '2026-01-01T00:00:00.000Z',
    };

    expect(buildEditSourcePolicy(approved, pending)).toEqual({
      show_source_picker: false,
      default_source: 'pending_mine',
      will_override_pending: true,
    });
  });
});

describe('resolveEditFormState', () => {
  const approved = {
    version_id: 'approved-v1',
    title: 'Approved Title',
    category_id: 'approved-category',
    character_id: null,
    content: 'approved content',
    created_at: '2026-01-01T00:00:00.000Z',
  };
  const pending = {
    version_id: 'pending-v1',
    title: 'Pending Title',
    category_id: 'pending-category',
    character_id: 'Tom',
    content: 'pending content',
    created_at: '2026-01-02T00:00:00.000Z',
  };

  it('returns full-form snapshot for pending source', () => {
    expect(
      resolveEditFormState({ edit_sources: { approved, pending_mine: pending } }, 'pending_mine')
    ).toEqual({
      title: 'Pending Title',
      category: 'pending-category',
      characterId: 'Tom',
      content: 'pending content',
    });
  });

  it('falls back to approved source when pending source is missing', () => {
    expect(
      resolveEditFormState({ edit_sources: { approved, pending_mine: null } }, 'pending_mine')
    ).toEqual({
      title: 'Approved Title',
      category: 'approved-category',
      characterId: null,
      content: 'approved content',
    });
  });
});
