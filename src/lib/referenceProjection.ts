import type {
  PublishedReferenceRow,
  ReferenceGroup,
  ReferenceSection,
} from '@/lib/gameData/published/reverseReferences';
import {
  referenceSourceAt,
  type ReferenceCatalog,
  type ReferenceLocation,
} from '@/lib/referenceSources';
import { getReferenceExcerpt } from '@/lib/referenceText';
import { getFactionLabel } from '@/constants/factions';

type RowView = Omit<PublishedReferenceRow, 'location'>;
type ReferencePointer = { at: ReferenceLocation; owner?: string };
type PackedRow = RowView | ReferencePointer;
export type PackedGroup = Omit<ReferenceGroup, 'rows'> & { rows: PackedRow[] };
export type PackedSection = Omit<ReferenceSection, 'groups'> & { groups: PackedGroup[] };

function readPointer(
  canonical: ReferenceCatalog,
  pointer: ReferencePointer,
  keywords: ReferenceGroup['keywords'],
  mobile: boolean
): RowView | undefined {
  const source = referenceSourceAt(canonical, pointer.at);
  if (!source) return;
  const terms = [
    ...keywords.originalKeywords,
    ...keywords.aliasKeywords,
    ...keywords.groupKeywords,
  ];
  let ownerSuffix = pointer.owner;
  if (source.skillOwner) {
    const { id, factionId } = source.skillOwner;
    const faction = getFactionLabel(factionId);
    ownerSuffix = '（' + (faction ? faction + '‐' : '') + id + '）';
  }
  return {
    ...source.item,
    href: source.href,
    imageUrl: source.imageUrl || '/images/icons/cat-faction.png',
    ...(ownerSuffix ? { ownerSuffix } : {}),
    description: getReferenceExcerpt(source.fields, terms, mobile),
  };
}

// The server compares both views against the actual published row. New or edited rows travel
// with the page whenever the bundled baseline cannot reproduce exactly what the snapshot says.
export function packReferenceSection(
  canonical: ReferenceCatalog,
  section: ReferenceSection
): PackedSection {
  return {
    ...section,
    groups: section.groups.map((group) => {
      const visible = (term: string) =>
        group.rows.some(
          (row) =>
            row.name.includes(term) ||
            row.description.includes(term) ||
            row.mobileDescription?.includes(term)
        );
      const keywords = {
        originalKeywords: group.keywords.originalKeywords.filter(visible),
        aliasKeywords: group.keywords.aliasKeywords.filter(visible),
        groupKeywords: group.keywords.groupKeywords.filter(visible),
      };
      const rows = group.rows.map(({ location, ...row }) => {
        const pointer = {
          at: location,
          ...(row.type === 'entity' && row.ownerSuffix ? { owner: row.ownerSuffix } : {}),
        };
        const desktop = readPointer(canonical, pointer, keywords, false);
        if (
          desktop &&
          desktop.name === row.name &&
          desktop.type === row.type &&
          desktop.factionId === row.factionId &&
          desktop.href === row.href &&
          desktop.imageUrl === row.imageUrl &&
          desktop.ownerSuffix === row.ownerSuffix &&
          desktop.description === row.description &&
          readPointer(canonical, pointer, keywords, true)?.description ===
            (row.mobileDescription ?? row.description)
        )
          return pointer;
        return row;
      });
      return { title: group.title, keywords, rows };
    }),
  };
}

export function unpackReferenceRow(
  canonical: ReferenceCatalog,
  row: PackedRow,
  keywords: ReferenceGroup['keywords'],
  mobile: boolean
): RowView {
  if ('at' in row) {
    const source = readPointer(canonical, row, keywords, mobile);
    if (!source) throw new Error('Missing bundled reference source');
    return source;
  }
  return mobile && row.mobileDescription !== undefined
    ? { ...row, description: row.mobileDescription }
    : row;
}
