import 'server-only';

import { cache } from 'react';

import { resolveItemFaction } from '@/lib/itemFaction';
import { getReferenceKeywords } from '@/lib/referenceKeywords';
import { packReferenceSection, type PackedSection } from '@/lib/referenceProjection';
import {
  matchesReference,
  referenceDomains,
  referenceSources,
  type ReferenceCatalog,
  type ReferenceLocation,
} from '@/lib/referenceSources';
import { getReferenceExcerpt, type CategorizedKeywords } from '@/lib/referenceText';
import { compareSingleItem, getSingleItemPrototype } from '@/lib/singleItemIdentity';
import { getFactionLabel } from '@/constants/factions';
import { createAutoWrapNames } from '@/data/createAutoWrapNames';
import type { FactionId, SingleItem } from '@/data/types';
import itemGroups from '@/features/items/data/itemGroups';

import type { ApprovedActionSnapshot } from './approvedActionSnapshot';
import { getCanonicalGameData } from './canonicalSources';
import { getApprovedActionSnapshot } from './getApprovedActionSnapshot';
import { getPublishedDomainReadModel } from './publishedSnapshot';
import { packReferenceRevisions } from './referenceRevisionProps';
import type { PublishedRevision } from './revision';

export type PublishedReferenceRow = SingleItem & {
  location: ReferenceLocation;
  href: string;
  imageUrl: string;
  ownerSuffix?: string;
  description: string;
  mobileDescription?: string;
};
export type ReferenceGroup = {
  title: string;
  rows: PublishedReferenceRow[];
  keywords: Omit<CategorizedKeywords, 'allKeywords'>;
};
export type ReferenceSection = {
  title: string;
  groups: ReferenceGroup[];
};
type ReferenceTarget = SingleItem & {
  sourceId?: string;
  skillLocation?: { characterId: string; index: number };
};

export const getReferenceActionSnapshot = () => getApprovedActionSnapshot(...referenceDomains);

function owners(value: ReferenceCatalog['entities'][string]['owner']): readonly SingleItem[] {
  if (!value) return [];
  return 'name' in value ? [value] : value;
}

function formatOwner(id: string, faction?: FactionId) {
  const label = getFactionLabel(faction);
  return label ? label + '‐' + id : id;
}

// Each source is visited once even when a character page asks for several skills and their entities.
export function selectReferenceSections(
  data: ReferenceCatalog,
  roots: readonly ReferenceTarget[]
): ReferenceSection[] {
  const autoWrapNames = createAutoWrapNames(data.characters, data.cards);
  const factionCache = new Map<string, FactionId | undefined>();
  const searches = new Map<
    string,
    {
      target: ReferenceTarget;
      keywords: CategorizedKeywords;
      rows: PublishedReferenceRow[];
      skippedSelf: boolean;
    }
  >();
  const sections = roots.map((root) => {
    const direct = root.type === 'character';
    const identity = root.sourceId ? { ...root, name: root.sourceId } : root;
    const entities: ReferenceTarget[] = direct
      ? []
      : Object.entries(data.entities)
          .filter(([, entity]) =>
            owners(entity.owner).some((owner) => compareSingleItem(owner, identity))
          )
          .map(([sourceId, entity]) => ({ name: entity.name, type: 'entity' as const, sourceId }));
    const prototypes = direct
      ? []
      : getSingleItemPrototype(identity).map((prototype) => {
          const sourceId = prototype.name;
          const record =
            prototype.type === 'item'
              ? data.items[sourceId]
              : prototype.type === 'entity'
                ? data.entities[sourceId]
                : undefined;
          return { ...prototype, sourceId, name: record?.name ?? sourceId };
        });
    const targets: ReferenceTarget[] = [root, ...entities, ...prototypes];
    const groups = targets.map((target, index) => {
      const key = JSON.stringify([
        target.type,
        target.name,
        target.factionId,
        target.sourceId,
        target.skillLocation?.characterId,
        target.skillLocation?.index,
      ]);
      let search = searches.get(key);
      if (!search) {
        search = {
          target,
          keywords: getReferenceKeywords(
            data,
            itemGroups,
            autoWrapNames,
            target,
            target.skillLocation,
            target.sourceId
          ),
          rows: [],
          skippedSelf: false,
        };
        searches.set(key, search);
      }
      const { allKeywords: _allKeywords, ...keywords } = search.keywords;
      const disambiguate = index > 0 && target.name === root.name;
      return {
        title: target.name + (disambiguate ? (index <= entities.length ? '-衍生物' : '-原型') : ''),
        rows: search.rows,
        keywords,
      };
    });
    const title = direct
      ? root.name + '自身'
      : root.name + (entities.length ? '及其衍生物' : '') + (prototypes.length ? '和原型' : '');
    return { title: title + '的引用项', groups };
  });
  for (const source of referenceSources(data)) {
    for (const search of searches.values()) {
      const { target, keywords, rows } = search;
      if (!matchesReference(source, keywords.allKeywords)) continue;
      if (
        !search.skippedSelf &&
        source.item.type === target.type &&
        (target.sourceId
          ? source.location[1] === target.sourceId
          : source.item.name === target.name) &&
        source.item.factionId === target.factionId &&
        (!target.skillLocation ||
          (target.skillLocation.characterId === source.skillOwner?.id &&
            target.skillLocation.index === source.skillOwner.index))
      ) {
        search.skippedSelf = true;
        continue;
      }
      let ownerNames: string[] = [];
      if (source.skillOwner)
        ownerNames = [formatOwner(source.skillOwner.id, source.skillOwner.factionId)];
      if (source.item.type === 'entity') {
        ownerNames = owners(source.entityOwners).map((owner) =>
          formatOwner(owner.name, resolveItemFaction(owner, data, new Set(), factionCache))
        );
      }
      const description = getReferenceExcerpt(source.fields, keywords.allKeywords, false);
      const mobileDescription = getReferenceExcerpt(source.fields, keywords.allKeywords, true);
      rows.push({
        ...source.item,
        location: source.location,
        href: source.href,
        imageUrl: source.imageUrl || '/images/icons/cat-faction.png',
        ...(ownerNames.length ? { ownerSuffix: '（' + ownerNames.join(' / ') + '）' } : {}),
        description,
        ...(description === mobileDescription ? {} : { mobileDescription }),
      });
    }
  }
  return sections.map((section) => ({
    ...section,
    groups: section.groups.filter((group) => group.rows.length),
  }));
}

const readReferenceCatalog = cache(async (snapshot: ApprovedActionSnapshot) => {
  const domains = await Promise.all(
    referenceDomains.map((domain) => getPublishedDomainReadModel(domain, snapshot))
  );
  const data = Object.fromEntries(
    domains.map((domain) => [domain.entityType, domain.data])
  ) as ReferenceCatalog;
  const revisions = Object.fromEntries(
    domains.map((domain) => [domain.entityType, domain.revision])
  ) as Record<(typeof referenceDomains)[number], PublishedRevision>;
  return { data, revisions };
});

type ReferenceDomain = (typeof referenceDomains)[number];
export type PackedReferencePage = {
  primary: ReferenceDomain;
  sections: PackedSection[];
  relatedRevisions: ReturnType<typeof packReferenceRevisions>;
};

export async function getReferencePage(
  snapshot: ApprovedActionSnapshot,
  primary: ReferenceDomain,
  roots: readonly ReferenceTarget[]
) {
  const { data, revisions } = await readReferenceCatalog(snapshot);
  const { [primary]: _primary, ...related } = revisions;
  const canonical = Object.fromEntries(
    referenceDomains.map((type) => [type, getCanonicalGameData(type)])
  ) as ReferenceCatalog;
  const page: PackedReferencePage = {
    primary,
    relatedRevisions: packReferenceRevisions(related),
    sections: selectReferenceSections(data, roots).map((section) =>
      packReferenceSection(canonical, section)
    ),
  };
  return { page, data };
}
